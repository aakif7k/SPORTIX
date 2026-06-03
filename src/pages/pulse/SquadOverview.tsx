import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SquadBanner } from '../../components/pulse/SquadBanner';
import { ChemistryBar } from '../../components/pulse/ChemistryBar';
import { PlayerCard } from '../../components/pulse/PlayerCard';
import { useSquad } from '../../hooks/useSquad';
import { useSquadStore } from '../../store/squadStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Lock, Trophy, Calendar, Clipboard, ArrowUpRight, 
  Plus, UserCheck, MessageSquare, ThumbsUp, Send, Image, 
  Vote, Award, Zap
} from 'lucide-react';
import { BadgeIcon } from '../../components/gamification/BadgeIcon';

export const SquadOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad, isCaptain, updateTacticalBoard } = useSquad(id);
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id || 'cu1';
  const { 
    createSquadEvent, 
    votePracticeSchedule, 
    startCaptainVote, 
    castCaptainVote, 
    addSquadPost, 
    likeSquadPost 
  } = useSquadStore();

  const [activeBottomTab, setActiveBottomTab] = useState<'upcoming' | 'achievements' | 'tactical' | 'feed' | 'governance'>('upcoming');
  const [formation, setFormation] = useState(squad?.formation || '4-3-3');
  const [notes, setNotes] = useState(squad?.tacticalNotes || '');
  const [isEditingTactics, setIsEditingTactics] = useState(false);

  // Form states
  const [isScheduling, setIsScheduling] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'practice' | 'match'>('practice');

  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState('');
  
  const [selectedCandidate, setSelectedCandidate] = useState('');

  if (!squad) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        Squad not found.
      </div>
    );
  }

  const handleSaveTactics = () => {
    updateTacticalBoard(squad.squadId, formation, notes);
    setIsEditingTactics(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;
    createSquadEvent(squad.squadId, eventTitle, eventDate, eventType);
    setEventTitle('');
    setEventDate('');
    setIsScheduling(false);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    addSquadPost(squad.squadId, postContent, postMedia || undefined);
    setPostContent('');
    setPostMedia('');
  };

  const handleStartVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    startCaptainVote(squad.squadId, selectedCandidate, currentUserId); // Zack u6 is initiator
    setSelectedCandidate('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.squadId}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.squadId}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.squadId}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.squadId}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.squadId}/settings` }
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
      <SquadBanner squad={squad} />

      {/* Chemistry & Boost row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-[20px] bg-elevated border border-border-muted">
          <h3 className="font-display text-[13px] tracking-wider text-text-secondary uppercase mb-3">TEAM PULSE SEGMENTS</h3>
          <ChemistryBar overallValue={squad.chemistry.overall} />
        </div>

        {/* Boost visual panel */}
        <div className={`p-5 rounded-[20px] border flex flex-col justify-center relative overflow-hidden transition-all ${
          squad.xpBoostActive 
            ? 'bg-volt-dim border-volt/30 shadow-card' 
            : 'bg-elevated border-border-muted'
        }`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-volt/5 blur-[25px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${squad.xpBoostActive ? 'bg-volt text-volt-text' : 'bg-surface text-text-secondary border border-border-muted'}`}>
              <Zap size={20} fill={squad.xpBoostActive ? 'currentColor' : 'none'} />
            </div>
            <div>
              <span className="font-mono text-[9px] text-text-secondary block uppercase">TRAINING CONSENSUS BOOST</span>
              <strong className={`font-display text-[15px] block ${squad.xpBoostActive ? 'text-volt' : 'text-text-primary'}`}>
                {squad.xpBoostActive ? '⚡ 1.5x XP STREAK ACTIVE' : 'PENDING ACCEPTANCE'}
              </strong>
            </div>
          </div>
          <p className="font-mono text-[9px] text-text-secondary mt-2.5 leading-snug">
            {squad.xpBoostActive 
              ? 'Consensus reached! All members confirmed attendance. XP and Chemistry multipliers are fully boosted.'
              : 'Schedule a practice session and get confirmations from all members to unlock the 30% XP boost.'}
          </p>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="space-y-4">
        <h3 className="font-display text-[18px] tracking-[3px] text-text-secondary uppercase">
          SQUAD ROSTER ({squad.members.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {squad.members.map((member) => (
            <div key={member.uid} className="relative group">
              <PlayerCard athlete={member} interactive={false} />
              
              {/* Badge level indicator */}
              {member.level !== undefined && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded bg-surface/85 flex items-center justify-center border border-volt/25 shadow-card">
                  <BadgeIcon level={member.level} size={15} animate={false} glow={false} />
                </div>
              )}
              
              {/* Overlay with details */}
              <div className="absolute inset-0 bg-base/75 rounded-[16px] backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                <span className="font-mono text-[9px] text-text-secondary uppercase">PROXIMITY</span>
                <span className="font-mono text-[12px] text-volt font-bold">
                  {member.distance === 0 ? 'Home Base (0 KM)' : `${member.distance} KM away`}
                </span>
                
                <button
                  onClick={() => navigate(`/app/profile/${member.uid}`)}
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
              {(squad.events || []).map((ev) => {
                const confirmedCount = Object.values(ev.votes || {}).filter(v => v === 'yes').length;
                const totalMembers = squad.members.length;
                const allConfirmed = confirmedCount >= totalMembers;
                
                const userVote = ev.votes?.[currentUserId];

                return (
                  <div 
                    key={ev.eventId} 
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
                          {new Date(ev.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
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
                          onClick={() => votePracticeSchedule(squad.squadId, ev.eventId, currentUserId, 'yes')}
                          className={`px-3 py-1 rounded font-bold text-[9px] uppercase transition-colors ${
                            userVote === 'yes'
                              ? 'bg-success text-white'
                              : 'bg-surface text-text-secondary border border-border-muted hover:bg-success-dim hover:text-success'
                          }`}
                        >
                          Confirm (Yes)
                        </button>
                        <button
                          onClick={() => votePracticeSchedule(squad.squadId, ev.eventId, currentUserId, 'no')}
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

              {(squad.events || []).length === 0 && (
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
              {(squad.posts || []).map((post) => {
                const isLiked = post.likes.includes(currentUserId);
                return (
                  <div key={post.postId} className="p-4 rounded-xl bg-base/20 border border-border-muted space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full object-cover border border-border-muted" />
                        <div>
                          <span className="font-condensed font-bold text-text-primary text-[13px] block">{post.authorName}</span>
                          <span className="font-mono text-[8px] text-text-muted block">
                            {new Date(post.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Level icon representation */}
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border-muted font-mono text-[8px] text-text-secondary uppercase">
                        SQUAD CHAT
                      </span>
                    </div>

                    <p className="font-mono text-[12px] text-text-primary leading-relaxed">{post.content}</p>

                    {post.mediaUrl && (
                      <div className="rounded-lg overflow-hidden border border-border-muted max-h-60 bg-surface/40">
                        <img src={post.mediaUrl} alt="Post Attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border-muted font-mono text-[10px]">
                      <button
                        onClick={() => likeSquadPost(squad.squadId, post.postId, currentUserId)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-surface transition-colors ${
                          isLiked ? 'text-volt' : 'text-text-secondary'
                        }`}
                      >
                        <ThumbsUp size={12} fill={isLiked ? 'currentColor' : 'none'} /> 
                        <span>{post.likes.length} Likes</span>
                      </button>
                      
                      <span className="text-[8px] text-text-secondary flex items-center gap-1">
                        <MessageSquare size={10} /> Internal Channel
                      </span>
                    </div>
                  </div>
                );
              })}

              {(squad.posts || []).length === 0 && (
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
                      {squad.tacticalNotes || 'No instructions set by captain.'}
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
                {squad.activeCaptainVote ? (
                  <div className="space-y-4 font-mono">
                    <div className="p-3 bg-volt-dim border border-volt/20 rounded-lg flex items-center gap-3">
                      <Vote className="text-volt" size={18} />
                      <div>
                        <span className="text-[9px] text-volt block uppercase font-bold">Democratic Poll Live</span>
                        <strong className="text-[12px] text-text-primary">
                          Proposal: Transfer captaincy to {squad.members.find(m => m.uid === squad.activeCaptainVote?.candidateId)?.name}
                        </strong>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    {(() => {
                      const totalMembers = squad.members.length;
                      const votes = squad.activeCaptainVote.votes || {};
                      const votedCount = Object.keys(votes).length;
                      const approvalCount = Object.values(votes).filter(v => v === squad.activeCaptainVote?.candidateId).length;

                      return (
                        <div className="space-y-3 text-[11px]">
                          <div className="flex justify-between text-text-secondary">
                            <span>Electoral turnouts:</span>
                            <span className="text-text-primary">{votedCount} / {totalMembers} Voted</span>
                          </div>
                          
                          <div className="flex justify-between text-volt">
                            <span>Approvals registered:</span>
                            <span className="font-bold">{approvalCount} / {Math.floor(totalMembers / 2) + 1} Needed for Majority</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t border-border-muted/40 mt-2">
                            <button
                              onClick={() => castCaptainVote(squad.squadId, currentUserId, squad.activeCaptainVote!.candidateId)}
                              className="px-4 py-1.5 bg-volt text-volt-text font-bold text-[10px] uppercase rounded"
                            >
                              Approve Candidate
                            </button>
                            <button
                              onClick={() => castCaptainVote(squad.squadId, currentUserId, 'no')}
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
                          {squad.members
                            .filter(m => m.uid !== squad.captainId) // filter out current captain
                            .map(m => (
                              <option key={m.uid} value={m.uid}>{m.name} ({m.position})</option>
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
              {squad.achievements.map((ach) => (
                <div
                  key={ach.id}
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
