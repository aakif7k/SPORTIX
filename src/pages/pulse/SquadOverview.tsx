import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { SquadBanner } from '../../components/pulse/SquadBanner';
import { ChemistryBar } from '../../components/pulse/ChemistryBar';
import { PlayerCard } from '../../components/pulse/PlayerCard';
import {
  useSquadDetail, useSquadChemistry, useSquadMutations,
  useSquadEvents, useSquadPosts, useSquadAchievements,
} from '@/hooks/useSquads';
import { useAuthStore } from '../../store/authStore';
import { api, ApiError } from '@/lib/api';
import { 
  Lock, Trophy, Calendar, Clipboard, ArrowUpRight, 
  Plus, UserCheck, MessageSquare, ThumbsUp, Send, Image, 
  Vote, Award, Zap
} from 'lucide-react';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';

export const SquadOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad, members, loading, error } = useSquadDetail(id);
  const { chemistry } = useSquadChemistry(id);
  const { updateTactics, voteLeadership } = useSquadMutations(id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { events, createEvent, voteEvent } = useSquadEvents(id);
  const { posts, createPost, likePost } = useSquadPosts(id);
  const { achievements } = useSquadAchievements(id);
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || '';
  const isCaptain = Boolean(squad && currentUserId && squad.captain_id === currentUserId);
  const [activeBottomTab, setActiveBottomTab] = useState<'upcoming' | 'achievements' | 'tactical' | 'feed' | 'governance'>('upcoming');
  const [formation, setFormation] = useState(squad?.formation || '4-3-3');
  const [notes, setNotes] = useState(squad?.tactical_notes || '');
  const [isEditingTactics, setIsEditingTactics] = useState(false);

  // Form states
  const [isScheduling, setIsScheduling] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'practice' | 'match'>('practice');

  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState('');
  
  const [selectedCandidate, setSelectedCandidate] = useState('');

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6" aria-busy="true">
        <div className="h-48 w-full rounded-3xl bg-elevated animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-elevated animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-56 rounded-2xl bg-elevated animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-2xl bg-surface border border-border-muted p-8 text-center space-y-3">
          <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
            {error?.status === 404 ? 'Squad not found' : 'Could not load this squad'}
          </p>
          <p className="font-mono text-[11px] text-text-secondary">
            {error?.status === 404
              ? 'It may have been disbanded.'
              : error?.status === 403
                ? 'You are not a member of this squad.'
                : error?.message ?? 'Something went wrong.'}
          </p>
          {error?.requestId && (
            <p className="font-mono text-[9px] text-text-muted">Reference: {error.requestId}</p>
          )}
          <button
            onClick={() => navigate('/pulse')}
            className="px-4 py-2 rounded-full bg-accent text-black font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-all"
          >
            Back to Pulse
          </button>
        </div>
      </div>
    );
  }

  const handleSaveTactics = () => {
    void updateTactics({ formation, tactical_notes: notes });
    setIsEditingTactics(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;
    void createEvent({ title: eventTitle, starts_at: eventDate, type: eventType });
    setEventTitle('');
    setEventDate('');
    setIsScheduling(false);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    void createPost({ content: postContent, media_url: postMedia || null });
    setPostContent('');
    setPostMedia('');
  };

  const handleStartVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    // A vote IS the proposal: the server tallies per-voter approvals and
    // promotes on a strict majority, so there is no separate 'start' step.
    void voteLeadership({ candidate_id: selectedCandidate, vote: 'approve' });
    setSelectedCandidate('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.$id}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.$id}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.$id}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.$id}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.$id}/settings` }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-text-primary space-y-8">
      {/* Secondary Sub-navigation */}
      <div className="flex gap-1.5 border-b border-border-muted pb-px font-mono text-[11px] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 border-b-2 font-bold tracking-wider transition-colors ${
              tab.id === 'overview'
                ? 'border-volt text-volt'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top Banner */}
      <SquadBanner
        squad={{
          ...squad,
          squadId: squad.$id,
          captainId: squad.captain_id,
          members,
          chemistry: chemistry ?? { overall: squad.chemistry_score, trust: squad.trust,
            coordination: squad.coordination, communication: squad.communication },
        } as never}
      />

      {/* Chemistry & Boost row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-[20px] bg-elevated border border-border-muted">
          <h3 className="font-display text-[13px] tracking-wider text-text-secondary uppercase mb-3">TEAM PULSE SEGMENTS</h3>
          <ChemistryBar overallValue={(chemistry?.overall ?? squad.chemistry_score)} />
        </div>

        {/* Boost visual panel */}
        <div className={`p-5 rounded-[20px] border flex flex-col justify-center relative overflow-hidden transition-all ${
          squad.xp_boost_active 
            ? 'bg-volt-dim border-volt/30 shadow-card' 
            : 'bg-elevated border-border-muted'
        }`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-volt/5 blur-[25px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${squad.xp_boost_active ? 'bg-volt text-volt-text' : 'bg-surface text-text-secondary border border-border-muted'}`}>
              <Zap size={20} fill={squad.xp_boost_active ? 'currentColor' : 'none'} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-text-secondary block uppercase">TRAINING CONSENSUS BOOST</span>
              <strong className={`font-display text-[15px] block ${squad.xp_boost_active ? 'text-volt' : 'text-text-primary'}`}>
                {squad.xp_boost_active ? '⚡ 1.5x XP STREAK ACTIVE' : 'PENDING ACCEPTANCE'}
              </strong>
            </div>
          </div>
          <p className="font-mono text-[9px] text-text-secondary mt-2.5 leading-snug">
            {squad.xp_boost_active 
              ? 'Consensus reached! All members confirmed attendance. XP and Chemistry multipliers are fully boosted.'
              : 'Schedule a practice session and get confirmations from all members to unlock the 30% XP boost.'}
          </p>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-[18px] tracking-[3px] text-text-secondary uppercase">
            SQUAD ROSTER ({members.length})
          </h3>
          {/* Until now a captain could only add an athlete who was already willing;
              there was no way to ask. */}
          {isCaptain && (
            <button
              onClick={() => setInviteOpen(o => !o)}
              className="px-3 py-1.5 rounded-[10px] bg-elevated border border-border-muted font-mono text-[10px] text-text-secondary hover:text-text-primary hover:border-volt/40 uppercase tracking-wider transition-colors"
            >
              {inviteOpen ? 'Close' : 'Invite athlete'}
            </button>
          )}
        </div>

        {isCaptain && inviteOpen && (
          <InvitePanel squadId={squad.$id} sport={squad.sport} onDone={() => setInviteOpen(false)} />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.user_id} className="relative group">
              <PlayerCard
                athlete={{
                  uid: member.user_id,
                  name: member.full_name,
                  avatar: member.avatar_url,
                  pulseScore: member.pulse_score,
                  tier: 'contender',
                  position: member.position,
                  role: member.role,
                  level: member.level,
                  sport: member.sport,
                } as never}
                interactive={false}
              />
              
              {/* Badge level indicator */}
              {member.level !== undefined && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded bg-surface/85 flex items-center justify-center border border-volt/25 shadow-card">
                  <BadgeIcon level={member.level} size={15} animate={false} glow={false} />
                </div>
              )}
              
              {/* Overlay with details */}
              <div className="absolute inset-0 bg-base/75 rounded-[16px] backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                {/* Distance was a mock field; no location data is stored per
                    member, so the overlay shows the squad role instead. */}
                <span className="font-mono text-[9px] text-text-secondary uppercase">ROLE</span>
                <span className="font-mono text-[12px] text-volt font-bold uppercase">
                  {member.role}
                </span>
                
                <button
                  onClick={() => navigate(`/app/profile/${member.user_id}`)}
                  className="px-4 py-2 bg-volt text-volt-text font-condensed font-bold text-[12px] tracking-wide rounded-[8px] uppercase flex items-center gap-1 hover:scale-105 transition-transform pointer-events-auto mt-2"
                >
                  View Profile <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Coordination Tabs */}
      <div className="p-6 rounded-[24px] bg-elevated border border-border-muted space-y-6 shadow-card">
        
        {/* Navigation for Bottom Section */}
        <div className="flex border-b border-border-muted pb-px gap-6 font-mono text-[11px] overflow-x-auto">
          {[
            { id: 'upcoming', label: 'Matches & Scheduling' },
            { id: 'feed', label: 'Team Highlights Feed' },
            { id: 'tactical', label: 'Tactical Board' },
            { id: 'governance', label: 'Governance & Votes' },
            { id: 'achievements', label: 'Squad Rewards' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id as any)}
              className={`pb-2.5 border-b-2 font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
                activeBottomTab === tab.id ? 'border-volt text-volt' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Upcoming Matches & Practice Consensus */}
        {activeBottomTab === 'upcoming' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display text-[16px] text-text-primary uppercase">SQUAD SCHEDULE & SCHEDULE POLLS</h4>
                <p className="font-mono text-[10px] text-text-secondary">Confirm practice times. All players must check "Yes" to activate XP boost.</p>
              </div>
              
              {isCaptain && (
                <button 
                  onClick={() => setIsScheduling(!isScheduling)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-volt text-volt-text font-mono text-[10px] font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  <Plus size={12} /> Schedule Session
                </button>
              )}
            </div>

            {/* Inline scheduling form */}
            {isScheduling && (
              <form onSubmit={handleScheduleSubmit} className="p-4 rounded-xl bg-base/40 border border-border-muted space-y-4 max-w-md">
                <h5 className="font-display text-[12px] text-volt uppercase font-bold">Create Scheduling Poll</h5>
                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <label className="block text-text-secondary mb-1">Session Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Wednesday Technical Drills" 
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full bg-surface border border-border-muted rounded-lg p-2 text-text-primary focus:outline-none focus:border-volt"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-secondary mb-1">Session Type</label>
                      <select 
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as any)}
                        className="w-full bg-surface border border-border-muted rounded-lg p-2 text-text-primary focus:outline-none focus:border-volt"
                      >
                        <option value="practice">Practice</option>
                        <option value="match">Match</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-surface border border-border-muted rounded-lg p-2 text-text-primary focus:outline-none focus:border-volt"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-3.5 py-1.5 bg-volt text-volt-text rounded font-mono text-[10px] font-bold">Schedule</button>
                  <button type="button" onClick={() => setIsScheduling(false)} className="px-3.5 py-1.5 bg-surface border border-border-muted text-text-primary rounded font-mono text-[10px]">Cancel</button>
                </div>
              </form>
            )}

            {/* List events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => {
                // The server sends an aggregate tally plus this caller's own
                // vote, rather than a map of every member's answer.
                const confirmedCount = ev.votes?.yes ?? 0;
                const totalMembers = ev.total_members || members.length;
                const allConfirmed = totalMembers > 0 && confirmedCount >= totalMembers;
                const userVote = ev.my_vote;

                return (
                  <div 
                    key={ev.$id} 
                    className={`p-5 rounded-[16px] bg-base/30 border transition-all ${
                      allConfirmed ? 'border-volt/30 bg-volt-dim' : 'border-border-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className={allConfirmed ? 'text-volt' : 'text-text-secondary'} />
                          <span className="font-condensed font-bold text-text-primary uppercase text-[15px]">{ev.title}</span>
                        </div>
                        <p className="font-mono text-[10px] text-text-secondary">
                          {new Date(ev.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[8px] uppercase font-bold border ${
                        allConfirmed 
                          ? 'bg-success-dim text-success border-success/20' 
                          : 'bg-surface text-text-secondary border-border-muted border'
                      }`}>
                        {allConfirmed ? 'Confirmed Boosted' : 'Pending Consensus'}
                      </span>
                    </div>

                    {/* Vote progress */}
                    <div className="mt-4 pt-3 border-t border-border-muted space-y-2 font-mono text-[10px]">
                      <div className="flex justify-between text-text-secondary">
                        <span>Attendance Confirmations:</span>
                        <strong className="text-text-primary">{confirmedCount} / {totalMembers} Yes</strong>
                      </div>
                      
                      {/* Consensus progress bar */}
                      <div className="h-1 bg-surface border border-border-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${allConfirmed ? 'bg-volt' : 'bg-success'}`}
                          style={{ width: `${(confirmedCount / totalMembers) * 100}%` }}
                        />
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex gap-2 items-center pt-2 border-t border-border-muted/50 mt-2">
                        <span className="text-text-muted text-[9px] mr-1">Your response:</span>
                        <button
                          onClick={() => voteEvent(ev.$id, 'yes')}
                          className={`px-3 py-1 rounded font-bold text-[9px] uppercase transition-colors ${
                            userVote === 'yes'
                              ? 'bg-success text-white'
                              : 'bg-surface text-text-secondary border border-border-muted hover:bg-success-dim hover:text-success'
                          }`}
                        >
                          Confirm (Yes)
                        </button>
                        <button
                          onClick={() => voteEvent(ev.$id, 'no')}
                          className={`px-3 py-1 rounded font-bold text-[9px] uppercase transition-colors ${
                            userVote === 'no'
                              ? 'bg-danger text-white'
                              : 'bg-surface text-text-secondary border border-border-muted hover:bg-danger-dim hover:text-danger'
                          }`}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="col-span-2 p-8 text-center rounded-xl bg-base/10 border border-dashed border-border-muted font-mono text-text-secondary text-[11px]">
                  No active schedules. Click "Schedule Session" above to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Team Highlights Feed */}
        {activeBottomTab === 'feed' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-display text-[16px] text-text-primary uppercase">SQUAD ACTIVITY & MEDIA HIGHLIGHTS</h4>
              <p className="font-mono text-[10px] text-text-secondary font-bold">Post screenshots, achievements, or announcements to the private team bulletin.</p>
            </div>

            {/* Create Post Form */}
            <form onSubmit={handleCreatePost} className="p-4 rounded-xl bg-base/30 border border-border-muted space-y-3 font-mono">
              <textarea
                placeholder="Announce something or share training stats..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={2}
                className="w-full bg-surface border border-border-muted rounded-lg p-3 text-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-volt resize-none"
                required
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Image size={14} className="text-volt" />
                  <input
                    type="text"
                    placeholder="Attach Image/GIF URL (optional)..."
                    value={postMedia}
                    onChange={(e) => setPostMedia(e.target.value)}
                    className="flex-1 bg-surface border border-border-muted rounded-lg px-3 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-volt"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-volt text-volt-text font-bold text-[10px] uppercase rounded flex items-center gap-1 hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
                >
                  <Send size={10} /> Share Post
                </button>
              </div>
            </form>

            {/* Posts feed */}
            <div className="space-y-4 max-w-2xl">
              {posts.map((post) => {
                const isLiked = post.is_liked;
                return (
                  <div key={post.$id} className="p-4 rounded-xl bg-base/20 border border-border-muted space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={post.author_avatar_url ?? undefined} alt={post.author_name ?? ''} className="w-8 h-8 rounded-full object-cover border border-border-muted" />
                        <div>
                          <span className="font-condensed font-bold text-text-primary text-[13px] block">{post.author_name}</span>
                          <span className="font-mono text-[8px] text-text-muted block">
                            {new Date(post.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Level icon representation */}
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border-muted font-mono text-[8px] text-text-secondary uppercase">
                        SQUAD CHAT
                      </span>
                    </div>

                    <p className="font-mono text-[12px] text-text-primary leading-relaxed">{post.content}</p>

                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden border border-border-muted max-h-60 bg-surface/40">
                        <img src={post.media_url} alt="Post Attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border-muted font-mono text-[10px]">
                      <button
                        onClick={() => likePost(post.$id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-surface transition-colors ${
                          isLiked ? 'text-volt' : 'text-text-secondary'
                        }`}
                      >
                        <ThumbsUp size={12} fill={isLiked ? 'currentColor' : 'none'} /> 
                        <span>{post.likes_count} Likes</span>
                      </button>
                      
                      <span className="text-[8px] text-text-secondary flex items-center gap-1">
                        <MessageSquare size={10} /> Internal Channel
                      </span>
                    </div>
                  </div>
                );
              })}

              {posts.length === 0 && (
                <div className="p-8 text-center rounded-xl bg-base/10 border border-dashed border-border-muted font-mono text-text-secondary text-[11px]">
                  No posts shared on the team bulletin yet. Be the first to share an update!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Tactical Board */}
        {activeBottomTab === 'tactical' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display text-[16px] text-text-primary">TACTICAL BOARD</h4>
                <p className="font-mono text-[10px] text-text-secondary mt-0.5">Configure tactics and formations for match readiness.</p>
              </div>
              {isCaptain && !isEditingTactics && (
                <button
                  onClick={() => setIsEditingTactics(true)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-surface border border-border-muted hover:bg-hover font-mono text-[10px] text-text-primary"
                >
                  Edit Board
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Formation display */}
              <div className="p-5 rounded-[16px] bg-base/30 border border-border-muted flex flex-col items-center justify-center text-center space-y-2">
                <span className="font-mono text-[9px] text-text-secondary">TACTICAL SETTING</span>
                {isEditingTactics ? (
                  <input
                    type="text"
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="bg-surface border border-border-muted rounded-[8px] px-3 py-1 font-mono text-[18px] text-center text-volt w-28 focus:outline-none focus:border-volt"
                  />
                ) : (
                  <span className="font-display text-[40px] text-volt tracking-wider leading-none">
                    {squad.formation}
                  </span>
                )}
                <span className="font-mono text-[9px] text-text-secondary">FORMULATION</span>
              </div>

              {/* Notes */}
              <div className="md:col-span-2 p-5 rounded-[16px] bg-base/30 border border-border-muted flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-text-secondary font-mono text-[9px]">
                    <Clipboard size={12} />
                    <span>CAPTAIN INSTRUCTIONS</span>
                  </div>
                  {isEditingTactics ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-surface border border-border-muted rounded-[10px] p-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt resize-none"
                    />
                  ) : (
                    <p className="font-mono text-[12px] text-text-primary leading-relaxed">
                      {squad.tactical_notes || 'No instructions set by captain.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border-muted mt-4">
                  <span className="font-mono text-[8px] text-text-secondary">Last active: Today 15:00</span>
                  {isEditingTactics && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTactics}
                        className="px-3 py-1.5 rounded-[8px] bg-volt text-volt-text font-mono text-[10px] font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingTactics(false)}
                        className="px-3 py-1.5 rounded-[8px] bg-surface text-text-primary border border-border-muted font-mono text-[10px] hover:bg-hover"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Governance & Captain Elections */}
        {activeBottomTab === 'governance' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-display text-[16px] text-text-primary uppercase">SQUAD GOVERNANCE & ELECTION DESK</h4>
              <p className="font-mono text-[10px] text-text-secondary font-bold">
                Captaincy requires democratic approval. Members can initiate elections to transfer control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Election Details */}
              <div className="md:col-span-2 p-5 rounded-[16px] bg-base/30 border border-border-muted space-y-4">
                {/*
                  The API has no notion of a single "active vote" to open and
                  close: leadership_votes records one approval per member and the
                  server promotes a candidate the moment one holds a strict
                  majority. So the UI is "pick someone and approve" rather than
                  "start an election, then vote in it", and the tally shown is
                  whatever the last vote returned.
                */}
                {selectedCandidate ? (
                  <div className="space-y-4 font-mono">
                    <div className="p-3 bg-volt-dim border border-volt/20 rounded-lg flex items-center gap-3">
                      <Vote className="text-volt" size={18} />
                      <div>
                        <span className="text-[9px] text-volt block uppercase font-bold">Leadership vote</span>
                        <strong className="text-[12px] text-text-primary">
                          Transfer captaincy to {members.find(m => m.user_id === selectedCandidate)?.full_name ?? 'this member'}
                        </strong>
                      </div>
                    </div>

                    {(() => {
                      const totalMembers = members.length;
                      const needed = Math.floor(totalMembers / 2) + 1;

                      return (
                        <div className="space-y-3 text-[11px]">
                          <div className="flex justify-between text-text-secondary">
                            <span>Squad size:</span>
                            <span className="text-text-primary">{totalMembers} members</span>
                          </div>

                          <div className="flex justify-between text-volt">
                            <span>Approvals needed:</span>
                            <span className="font-bold">{needed} for a majority</span>
                          </div>

                          <p className="text-[9px] text-text-muted leading-relaxed">
                            Each member may approve once and can change their mind. The
                            handover happens automatically on the {needed}th approval.
                          </p>

                          <div className="flex gap-2 pt-2 border-t border-border-muted/40 mt-2">
                            <button
                              onClick={() => voteLeadership({ candidate_id: selectedCandidate, vote: 'approve' })}
                              className="px-4 py-1.5 bg-volt text-volt-text font-bold text-[10px] uppercase rounded"
                            >
                              Approve Candidate
                            </button>
                            <button
                              onClick={() => voteLeadership({ candidate_id: selectedCandidate, vote: 'reject' })}
                              className="px-4 py-1.5 bg-surface border border-border-muted text-text-primary font-bold text-[10px] uppercase rounded hover:bg-hover"
                            >
                              Reject Vote
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-base/40 border border-border-muted text-center text-text-secondary font-mono text-[11px] py-8">
                      <UserCheck size={20} className="mx-auto text-text-secondary mb-2" />
                      <span>No captain election in progress. Democratic governance remains stable.</span>
                    </div>

                    {/* Start election form */}
                    <form onSubmit={handleStartVoteSubmit} className="pt-4 border-t border-border-muted flex flex-col sm:flex-row gap-3 items-end font-mono">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[10px] text-text-secondary uppercase">Nominate New Captain Candidate</label>
                        <select
                          value={selectedCandidate}
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          className="w-full bg-surface border border-border-muted rounded-lg p-2 text-[11px] text-text-primary focus:outline-none focus:border-volt"
                          required
                        >
                          <option value="">Select Candidate...</option>
                          {members
                            .filter(m => m.user_id !== squad.captain_id) // filter out current captain
                            .map(m => (
                              <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.position})</option>
                            ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-surface border border-border-muted hover:border-volt hover:text-volt text-text-primary font-bold text-[10px] uppercase rounded transition-colors"
                      >
                        Start Captain Vote
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Electoral Info Card */}
              <div className="p-5 rounded-[16px] bg-base/30 border border-border-muted space-y-3 font-mono text-[10px]">
                <div className="flex items-center gap-2 text-volt uppercase font-bold">
                  <Award size={14} />
                  <span>Captain Rights</span>
                </div>
                <ul className="space-y-2 text-text-secondary leading-snug list-disc pl-4">
                  <li>Edit tactical formation and directives.</li>
                  <li>Draft and coordinate match practice times.</li>
                  <li>Manage team settings and register for Elite Leagues.</li>
                  <li>Initiators must secure a democratic absolute majority (&gt; 50% squad size) to enforce transfer.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Achievements */}
        {activeBottomTab === 'achievements' && (
          <div className="space-y-4">
            <h4 className="font-display text-[16px] text-text-primary">SQUAD REWARDS & MILESTONES</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.key}
                  style={{ opacity: ach.unlocked ? 1 : 0.3 }}
                  className="p-4 rounded-[16px] bg-base/20 border border-border-muted flex flex-col items-center text-center space-y-2 relative"
                >
                  {!ach.unlocked && (
                    <div className="absolute top-2 right-2 text-text-secondary">
                      <Lock size={12} />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-volt-dim flex items-center justify-center text-volt">
                    <Trophy size={18} />
                  </div>
                  <h5 className="font-condensed font-bold text-[13px] text-text-primary uppercase leading-none">{ach.name}</h5>
                  <p className="font-mono text-[9px] text-text-secondary leading-snug">{ach.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Search for an athlete and invite them.
 *
 * Reuses the people search the messages composer uses; the invitation itself is a
 * squad_invites row with a pending state, so the athlete decides rather than being
 * added without being asked.
 */
const InvitePanel: React.FC<{
  squadId: string;
  sport: string;
  onDone: () => void;
}> = ({ squadId, sport, onDone }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{
    id: string; name: string; username: string; avatar: string | null; sport: string;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const needle = query.trim();
  const tooShort = needle.length < 2;

  useEffect(() => {
    if (tooShort) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      api.get<{ data: { users?: Array<Record<string, unknown>> } }>(
        `/api/search/?type=users&q=${encodeURIComponent(needle)}`,
        { signal: controller.signal },
      ).then(res => {
        setResults((res.data?.users ?? []).map(u => ({
          id: String(u.$id ?? ''),
          name: String(u.full_name ?? ''),
          username: String(u.username ?? ''),
          avatar: (u.avatar_url as string | null) ?? null,
          sport: String(u.sport ?? ''),
        })).filter(u => u.id));
        setSearching(false);
      }).catch(() => {
        if (!controller.signal.aborted) { setResults([]); setSearching(false); }
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [needle, tooShort]);

  const send = async (userId: string) => {
    setSending(userId);
    try {
      await api.post(`/api/squads/${squadId}/invites`, { user_id: userId });
      toast.success('Invitation sent');
      onDone();
    } catch (e) {
      toast.error((e as ApiError).message || 'Could not send that invitation');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-4 rounded-[16px] bg-surface border border-border-muted space-y-3">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={`Search ${sport} athletes by name or handle...`}
        className="w-full h-10 rounded-[10px] bg-base border border-border-muted px-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt"
      />
      {tooShort ? (
        <p className="font-mono text-[10px] text-text-muted">
          Type at least two characters.
        </p>
      ) : searching ? (
        <div className="space-y-2" aria-busy="true" aria-label="Searching athletes">
          {[0, 1].map(i => <div key={i} className="h-12 rounded-[10px] bg-elevated animate-shimmer" />)}
        </div>
      ) : results.length === 0 ? (
        <p className="font-mono text-[10px] text-text-muted">No athletes found.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map(athlete => (
            <div key={athlete.id}
              className="flex items-center gap-3 p-2 rounded-[10px] bg-elevated border border-border-muted">
              <img src={athlete.avatar ?? undefined} alt={athlete.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] text-text-primary truncate">{athlete.name}</p>
                <p className="font-mono text-[9px] text-text-muted truncate">
                  @{athlete.username}{athlete.sport ? ` · ${athlete.sport}` : ''}
                </p>
              </div>
              <button
                onClick={() => void send(athlete.id)}
                disabled={sending !== null}
                className="px-3 py-1.5 rounded-[8px] bg-volt text-volt-text font-mono text-[9px] font-bold uppercase disabled:opacity-40"
              >
                {sending === athlete.id ? 'Sending…' : 'Invite'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
