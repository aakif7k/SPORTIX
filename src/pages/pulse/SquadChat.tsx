import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquadDetail } from '@/hooks/useSquads';
import {
  useSquadChannel, blobString, blobPollOptions, type SquadMessageInput,
} from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from '../../components/pulse/RoleBadge';
import { Send, Plus, Paperclip, MoreVertical, Award, Info, HelpCircle, RefreshCw, X } from 'lucide-react';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';
import type { SquadRole } from '@/types/api.types';

type SpecialType = 'announcement' | 'tactical' | 'poll';

export const SquadChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { squad, members, loading: squadLoading, error: squadError } = useSquadDetail(id);
  const {
    messages, loading, error, refresh, sendMessage, sending,
  } = useSquadChannel(id);

  const isCaptain = Boolean(squad && currentUserId && squad.captain_id === currentUserId);

  const [text, setText] = useState('');
  const [showSpecialMenu, setShowSpecialMenu] = useState(false);
  const [special, setSpecial] = useState<SpecialType | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // New messages arrive over a realtime subscription, so the view has to follow
  // them; this only touches the DOM.
  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  if (squadLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6" aria-busy="true" aria-label="Loading squad">
        <div className="h-8 w-2/3 rounded bg-elevated animate-shimmer" />
        <div className="h-[60vh] rounded-[20px] bg-surface border border-border-muted/50 animate-shimmer" />
      </div>
    );
  }

  if (squadError || !squad) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          Squad not available
        </p>
        <p className="font-mono text-[11px] text-text-secondary">
          {squadError?.message ?? 'This squad does not exist, or you are not a member of it.'}
        </p>
        <button
          onClick={() => navigate('/pulse')}
          className="px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[11px] font-bold uppercase"
        >
          Back to Pulse
        </button>
      </div>
    );
  }

  const send = async (payload: SquadMessageInput) => {
    try {
      await sendMessage(payload);
      setText('');
      setSpecial(null);
    } catch {
      // useSquadChannel has already surfaced the reason; the text stays put so
      // nothing typed is lost.
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    void send({ content: text.trim(), type: 'text' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.$id}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.$id}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.$id}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.$id}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.$id}/settings` }
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
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-elevated">{members.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {[...members]
              .sort((a, b) => (a.role === 'captain' ? -1 : b.role === 'captain' ? 1 : 0))
              .map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-elevated cursor-pointer transition-colors">
                  <div className="relative">
                    <img src={member.avatar_url ?? undefined} alt={member.full_name} className="w-8 h-8 rounded-full object-cover border border-border-muted" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success border-2 border-surface" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-condensed text-[13px] font-bold text-text-primary truncate leading-none">{member.full_name}</p>
                      {member.level !== undefined && (
                        <div className="scale-75 origin-left flex-shrink-0">
                          <BadgeIcon level={member.level} size={14} animate={false} glow={false} />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {member.position && <span className="font-mono text-[8px] text-volt">#{member.position}</span>}
                      {member.role && member.role !== 'member' && (
                        <RoleBadge role={member.role as SquadRole} />
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
            {loading ? (
              <div aria-busy="true" aria-label="Loading messages" className="space-y-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="h-11 rounded-[12px] bg-elevated animate-shimmer"
                      style={{ width: `${40 + (i % 3) * 14}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="max-w-sm mx-auto p-5 rounded-[14px] bg-elevated border border-border-muted text-center space-y-3">
                <p className="font-display text-[13px] text-text-primary uppercase tracking-wide">
                  The channel did not load
                </p>
                <p className="font-mono text-[10px] text-text-secondary">{error.message}</p>
                <button
                  onClick={() => refresh()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="max-w-sm mx-auto p-6 rounded-[14px] bg-elevated border border-border-muted text-center space-y-2">
                <p className="font-display text-[13px] text-text-primary uppercase tracking-wide">
                  Channel is quiet
                </p>
                <p className="font-mono text-[10px] text-text-secondary">
                  {isCaptain
                    ? 'Post an announcement, a tactical update or a poll to get the squad moving.'
                    : 'Be the first to say something — every member sees it live.'}
                </p>
              </div>
            ) : messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const senderMember = members.find(m => m.user_id === msg.sender_id);

              if (msg.type === 'announcement') {
                const matchTime = blobString(msg.announcement_data, 'match_time');
                return (
                  <div key={msg.$id} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border-l-[3px] border-orange-400 space-y-3 font-mono text-[12px] shadow-card">
                    <p className="text-[#f97316] font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <Info size={12} /> Match Announcement
                    </p>
                    <p className="text-text-primary leading-relaxed">{msg.content}</p>
                    <div className="flex gap-2 pt-1.5">
                      <button className="px-3 py-1.5 rounded-[6px] bg-success text-white font-bold text-[9px] uppercase">Confirm</button>
                      <button className="px-3 py-1.5 rounded-[6px] bg-elevated text-text-secondary text-[9px] uppercase hover:bg-elevated/80">Maybe</button>
                      <button className="px-3 py-1.5 rounded-[6px] bg-elevated text-text-secondary text-[9px] uppercase hover:bg-elevated/80">Declined</button>
                    </div>
                    {matchTime && (
                      <span className="block text-[8px] text-text-secondary text-right">Match: {matchTime}</span>
                    )}
                  </div>
                );
              }

              if (msg.type === 'tactical') {
                return (
                  <div key={msg.$id} style={{ borderLeftColor: 'var(--plasma)' }} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border-l-[3px] space-y-2 font-mono text-[12px] shadow-card">
                    <p style={{ color: 'var(--plasma)' }} className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <Plus size={12} /> Tactical Instruction
                    </p>
                    <span style={{ color: 'var(--plasma)' }} className="font-display text-[22px] block leading-none">
                      {blobString(msg.tactical_data, 'formation')}
                    </span>
                    <p className="text-text-secondary leading-snug">{blobString(msg.tactical_data, 'notes') || msg.content}</p>
                    <span className="block text-[8px] text-text-secondary text-right">
                      — {senderMember?.full_name || msg.sender_name || 'Captain'}
                    </span>
                  </div>
                );
              }

              if (msg.type === 'poll') {
                const options = blobPollOptions(msg.poll_data);
                return (
                  <div key={msg.$id} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border border-border-muted space-y-3 font-mono text-[12px] shadow-card">
                    <p className="text-warning font-bold flex items-center gap-1.5 uppercase text-[10px]">
                      <HelpCircle size={12} /> Squad Poll
                    </p>
                    <p className="text-text-primary font-bold">{blobString(msg.poll_data, 'question') || msg.content}</p>

                    <div className="space-y-2">
                      {options.map((opt, idx) => (
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
                  <div key={msg.$id} className="max-w-md mx-auto p-4 rounded-[14px] bg-surface border border-volt/20 space-y-2 text-center shadow-glow-volt-sm font-mono">
                    <Award className="mx-auto text-volt" size={20} fill="var(--volt)" />
                    <p className="text-[12px] font-bold text-text-primary uppercase">{msg.content}</p>
                    <p className="text-[9px] text-text-secondary">Pulse Engine chemistry threshold unlocked.</p>
                  </div>
                );
              }

              return (
                <div key={msg.$id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <img src={msg.sender_avatar_url ?? senderMember?.avatar_url ?? undefined} alt={msg.sender_name ?? ''} className="w-7 h-7 rounded-full object-cover mt-1" />
                  )}
                  <div className="space-y-1">
                    {!isMe && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-condensed text-[11px] font-bold text-text-primary leading-none">
                          {msg.sender_name || senderMember?.full_name}
                        </span>
                        {senderMember?.level !== undefined && (
                          <div className="scale-75 origin-left flex-shrink-0 translate-y-[2px]">
                            <BadgeIcon level={senderMember.level} size={14} animate={false} glow={false} />
                          </div>
                        )}
                        {msg.sender_role && (
                          <span className="text-[7px] font-mono font-bold bg-text-primary/10 px-1 py-0.2 rounded uppercase">{msg.sender_role}</span>
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
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Special composer. The three buttons used to post a hardcoded fixture
              — a match against a team that does not exist, at a time nobody
              chose — to the whole squad. They collect their own content now. */}
          {special && (
            <SpecialComposer
              type={special}
              busy={sending}
              onCancel={() => setSpecial(null)}
              onSubmit={send}
            />
          )}

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
                      onClick={() => { setShowSpecialMenu(false); setSpecial('announcement'); }}
                      className="w-full text-left py-2 px-3 hover:bg-elevated rounded-[6px] text-text-primary"
                    >
                      Match Announcement
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSpecialMenu(false); setSpecial('tactical'); }}
                      className="w-full text-left py-2 px-3 hover:bg-elevated rounded-[6px]"
                      style={{ color: 'var(--plasma)' }}
                    >
                      Tactical Update
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSpecialMenu(false); setSpecial('poll'); }}
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
              disabled={sending || !text.trim()}
              className="w-10 h-10 rounded-[10px] bg-volt text-volt-text hover:opacity-90 flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

/**
 * Collects the content a special message actually needs, instead of posting a
 * fixture. Poll options are one per line, which is the least fussy way to enter
 * a short list on a phone.
 */
const SpecialComposer: React.FC<{
  type: SpecialType;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (payload: SquadMessageInput) => void;
}> = ({ type, busy, onCancel, onSubmit }) => {
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [tertiary, setTertiary] = useState('');

  const labels = {
    announcement: {
      title: 'Match Announcement',
      accent: '#f97316',
      primary: 'What is happening?',
      secondary: 'When (e.g. Saturday 6PM)',
      tertiary: 'Where',
    },
    tactical: {
      title: 'Tactical Update',
      accent: 'var(--plasma)',
      primary: 'Formation (e.g. 4-3-3)',
      secondary: 'Instructions for the squad',
      tertiary: '',
    },
    poll: {
      title: 'Squad Poll',
      accent: 'var(--warning)',
      primary: 'Question',
      secondary: 'Options, one per line',
      tertiary: '',
    },
  }[type];

  const ready = type === 'poll'
    ? primary.trim().length > 0 && secondary.split('\n').filter(l => l.trim()).length >= 2
    : primary.trim().length > 0;

  const submit = () => {
    if (!ready || busy) return;

    if (type === 'announcement') {
      onSubmit({
        content: primary.trim(),
        type: 'announcement',
        announcement_data: {
          match_time: secondary.trim(),
          venue: tertiary.trim(),
        },
      });
      return;
    }

    if (type === 'tactical') {
      onSubmit({
        content: `Tactical update: ${primary.trim()}`,
        type: 'tactical',
        tactical_data: { formation: primary.trim(), notes: secondary.trim() },
      });
      return;
    }

    onSubmit({
      content: primary.trim(),
      type: 'poll',
      poll_data: {
        question: primary.trim(),
        options: secondary.split('\n').map(l => l.trim()).filter(Boolean)
          .map(text => ({ text, votes: 0 })),
      },
    });
  };

  return (
    <div className="px-4 pt-4 border-t border-border-muted bg-base flex-shrink-0 space-y-2">
      <div className="flex items-center justify-between">
        <p style={{ color: labels.accent }} className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {labels.title}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="p-1 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-elevated"
        >
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        value={primary}
        onChange={e => setPrimary(e.target.value)}
        placeholder={labels.primary}
        className="w-full h-9 bg-surface border border-border-muted rounded-[8px] px-3 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt"
      />

      {type === 'poll' ? (
        <textarea
          value={secondary}
          onChange={e => setSecondary(e.target.value)}
          placeholder={labels.secondary}
          rows={3}
          className="w-full bg-surface border border-border-muted rounded-[8px] px-3 py-2 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt resize-none"
        />
      ) : (
        <input
          type="text"
          value={secondary}
          onChange={e => setSecondary(e.target.value)}
          placeholder={labels.secondary}
          className="w-full h-9 bg-surface border border-border-muted rounded-[8px] px-3 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt"
        />
      )}

      {labels.tertiary && (
        <input
          type="text"
          value={tertiary}
          onChange={e => setTertiary(e.target.value)}
          placeholder={labels.tertiary}
          className="w-full h-9 bg-surface border border-border-muted rounded-[8px] px-3 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt"
        />
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ready || busy}
        className="w-full h-9 rounded-[8px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Posting…' : `Post ${labels.title}`}
      </button>
    </div>
  );
};
