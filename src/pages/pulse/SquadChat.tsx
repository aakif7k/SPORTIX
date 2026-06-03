import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquad } from '../../hooks/useSquad';
import { useAuthStore } from '../../store/authStore';
import { RoleBadge } from '../../components/pulse/RoleBadge';
import { Send, Plus, Paperclip, MoreVertical, Award, Info, HelpCircle } from 'lucide-react';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';

export const SquadChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad, squadChats, isCaptain, sendChatMessage } = useSquad(id);
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || 'cu1';
  const currentUserName = user?.name || 'Alex Rivera (You)';
  const currentUserAvatar = user?.avatar || 'https://images.pexels.com/photos/1486064/pexels-photo-1486064.jpeg?cs=srgb&dl=pexels-nkhajotia-1486064.jpg&fm=jpg';

  const [text, setText] = useState('');
  const [showSpecialMenu, setShowSpecialMenu] = useState(false);

  if (!squad) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        Squad not found.
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendChatMessage(squad.squadId, {
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      senderRole: isCaptain ? 'captain' : 'member',
      content: text,
      type: 'text'
    });
    setText('');
  };

  const handleSendSpecial = (type: 'announcement' | 'tactical' | 'poll') => {
    setShowSpecialMenu(false);
    
    if (type === 'announcement') {
      sendChatMessage(squad.squadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        senderRole: 'captain',
        content: '📅 Match vs Rapid XI — Saturday 6PM — City Ground',
        type: 'announcement',
        announcementData: {
          matchTime: 'Saturday 6PM',
          venue: 'City Ground'
        }
      });
    } else if (type === 'tactical') {
      sendChatMessage(squad.squadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        senderRole: 'captain',
        content: 'Tactical Update: Switching to 4-3-3 for this weekend',
        type: 'tactical',
        tacticalData: {
          formation: '4-3-3',
          notes: 'Prepare overlapping wings strategy'
        }
      });
    } else if (type === 'poll') {
      sendChatMessage(squad.squadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        senderRole: 'captain',
        content: 'Best time for practice?',
        type: 'poll',
        pollData: {
          question: 'Best time for practice?',
          options: [
            { text: 'Friday 5PM', votes: 1 },
            { text: 'Saturday 10AM', votes: 2 }
          ]
        }
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.squadId}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.squadId}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.squadId}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.squadId}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.squadId}/settings` }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Subnav */}
      <div className="flex gap-1.5 border-b border-border-muted pb-px font-mono text-[11px] overflow-x-auto flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 border-b-2 font-bold tracking-wider transition-colors ${
              tab.id === 'chat'
                ? 'border-volt text-volt'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main chat window container */}
      <div className="flex-1 min-h-0 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex overflow-hidden">
        
        {/* Left Panel: Member list */}
        <div className="w-64 border-r border-border-muted hidden md:flex flex-col bg-elevated/40">
          <div className="p-4 border-b border-border-muted flex items-center justify-between flex-shrink-0">
            <span className="font-display text-[14px] text-text-secondary uppercase tracking-wider">SQUAD MEMBERS</span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-elevated">{squad.members.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {squad.members
              .sort((a, b) => (a.role === 'captain' ? -1 : b.role === 'captain' ? 1 : 0))
              .map((member) => (
                <div key={member.uid} className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-elevated cursor-pointer transition-colors">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-border-muted" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success border-2 border-surface" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-condensed text-[13px] font-bold text-text-primary truncate leading-none">{member.name}</p>
                      {member.level !== undefined && (
                        <div className="scale-75 origin-left flex-shrink-0">
                          <BadgeIcon level={member.level} size={14} animate={false} glow={false} />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-[8px] text-volt">#{member.position}</span>
                      {member.role && member.role !== 'member' && (
                        <RoleBadge role={member.role} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-border-muted flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-display text-[16px] text-text-primary tracking-wide">{squad.name.toUpperCase()} CHAT</h3>
              <p className="font-mono text-[9px] text-success">Secure Tactical Channel</p>
            </div>
            <button className="p-2 rounded-full hover:bg-elevated text-text-secondary hover:text-text-primary">
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {squadChats.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const senderMember = squad.members.find(m => m.uid === msg.senderId);

              if (msg.type === 'announcement') {
                return (
                  <div key={msg.msgId} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border-l-[3px] border-orange-400 space-y-3 font-mono text-[12px] shadow-card">
                    <p className="text-[#f97316] font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <Info size={12} /> Match Announcement
                    </p>
                    <p className="text-text-primary leading-relaxed">{msg.content}</p>
                    <div className="flex gap-2 pt-1.5">
                      <button className="px-3 py-1.5 rounded-[6px] bg-success text-white font-bold text-[9px] uppercase">Confirm</button>
                      <button className="px-3 py-1.5 rounded-[6px] bg-elevated text-text-secondary text-[9px] uppercase hover:bg-elevated/80">Maybe</button>
                      <button className="px-3 py-1.5 rounded-[6px] bg-elevated text-text-secondary text-[9px] uppercase hover:bg-elevated/80">Declined</button>
                    </div>
                    <span className="block text-[8px] text-text-secondary text-right">Match: {msg.announcementData?.matchTime}</span>
                  </div>
                );
              }

              if (msg.type === 'tactical') {
                return (
                  <div key={msg.msgId} style={{ borderLeftColor: 'var(--plasma)' }} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border-l-[3px] space-y-2 font-mono text-[12px] shadow-card">
                    <p style={{ color: 'var(--plasma)' }} className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <Plus size={12} /> Tactical Instruction
                    </p>
                    <span style={{ color: 'var(--plasma)' }} className="font-display text-[22px] block leading-none">
                      {msg.tacticalData?.formation}
                    </span>
                    <p className="text-text-secondary leading-snug">{msg.tacticalData?.notes}</p>
                    <span className="block text-[8px] text-text-secondary text-right">— Captain {senderMember?.name || msg.senderName || 'Zack Miller'}</span>
                  </div>
                );
              }

              if (msg.type === 'poll') {
                return (
                  <div key={msg.msgId} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border border-border-muted space-y-3 font-mono text-[12px] shadow-card">
                    <p className="text-warning font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <HelpCircle size={12} /> Squad Poll
                    </p>
                    <p className="text-text-primary font-bold">{msg.pollData?.question}</p>
                    
                    <div className="space-y-2">
                      {msg.pollData?.options.map((opt, idx) => (
                        <button
                          key={idx}
                          className="w-full p-2.5 rounded-[8px] bg-elevated border border-border-muted text-left flex justify-between items-center text-[10px] hover:bg-elevated/80"
                        >
                          <span>{opt.text}</span>
                          <span className="text-volt font-bold">{opt.votes} votes</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (msg.type === 'achievement') {
                return (
                  <div key={msg.msgId} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border border-volt/20 space-y-2 text-center shadow-glow-volt-sm font-mono">
                    <Award className="mx-auto text-volt" size={20} fill="var(--volt)" />
                    <p className="text-[12px] font-bold text-text-primary uppercase">{msg.content}</p>
                    <p className="text-[9px] text-text-secondary">Pulse Engine chemistry threshold unlocked.</p>
                  </div>
                );
              }

              return (
                <div key={msg.msgId} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover mt-1" />
                  )}
                  <div className="space-y-1">
                    {!isMe && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-condensed text-[11px] font-bold text-text-primary leading-none">{msg.senderName}</span>
                        {senderMember?.level !== undefined && (
                          <div className="scale-75 origin-left flex-shrink-0 translate-y-[2px]">
                            <BadgeIcon level={senderMember.level} size={14} animate={false} glow={false} />
                          </div>
                        )}
                        {msg.senderRole && (
                          <span className="text-[7px] font-mono font-bold bg-text-primary/10 px-1 py-0.2 rounded uppercase">{msg.senderRole}</span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor: isMe ? 'var(--volt-dim)' : 'var(--bg-elevated)',
                        color: isMe ? 'var(--volt)' : 'var(--text-primary)'
                      }}
                      className="px-4 py-2.5 rounded-[12px] font-mono text-[12px] leading-relaxed"
                    >
                      {msg.content}
                    </div>
                    <span className="block text-[8px] text-text-secondary font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat input block */}
          <form onSubmit={handleSend} className="p-4 border-t border-border-muted bg-base flex-shrink-0 flex items-center gap-3 relative">
            {isCaptain && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpecialMenu(!showSpecialMenu)}
                  className="w-10 h-10 rounded-[10px] bg-elevated border border-border-muted text-volt hover:bg-elevated/80 flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
                
                {/* Special Action Dropdown */}
                {showSpecialMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface border border-border-muted rounded-[10px] shadow-card p-2 z-30 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSendSpecial('announcement')}
                      className="w-full text-left py-2 px-3 hover:bg-elevated rounded-[6px] text-text-primary"
                    >
                      Match Announcement
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSpecial('tactical')}
                      className="w-full text-left py-2 px-3 hover:bg-elevated rounded-[6px]"
                      style={{ color: 'var(--plasma)' }}
                    >
                      Tactical Update
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendSpecial('poll')}
                      className="w-full text-left py-2 px-3 hover:bg-elevated rounded-[6px] text-warning"
                    >
                      Create Poll
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="w-10 h-10 rounded-[10px] bg-elevated border border-border-muted text-text-secondary hover:text-text-primary flex items-center justify-center"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              placeholder="Send secure tactical message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 h-10 bg-base border border-border-muted rounded-[10px] px-4 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt"
            />

            <button
              type="submit"
              className="w-10 h-10 rounded-[10px] bg-volt text-volt-text hover:opacity-90 flex items-center justify-center transition-opacity"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
