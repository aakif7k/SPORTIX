import React, { useState, useEffect } from 'react';
import { useSquad } from '../../hooks/useSquad';
import { RoleBadge } from '../../components/pulse/RoleBadge';
import { Sparkles, Check, X } from 'lucide-react';

// Module scope keeps the component identity stable across renders; defined
// inside LeadershipApproval it was a fresh type on every tick of the countdown
// timer, remounting all five bars once a second.
const BreakdownBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between font-mono text-[9px] text-text-secondary">
      <span>{label.toUpperCase()}</span>
      <span className="text-text-primary font-bold">{value}%</span>
    </div>
    <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
      <div className="h-full bg-volt" style={{ width: `${value}%` }} />
    </div>
  </div>
);

export const LeadershipApproval: React.FC = () => {
  const { squad, isCaptain } = useSquad();
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'approve' | 'reject' | null>(null);

  // Countdown timer simulation
  const [timeLeft, setTimeLeft] = useState(48 * 60 * 60); // 48 hours in seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!squad) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        Squad not found.
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVote = (vote: 'approve' | 'reject') => {
    setUserVote(vote);
    setHasVoted(true);
  };


  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[44px] leading-none uppercase text-text-primary">LEADERSHIP APPROVAL</h1>
        <p className="font-mono text-[11px] text-text-secondary mt-1">
          AI-driven leadership analysis and recommendation protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Current Leadership Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Current Captain Card */}
          <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-5">
            <h3 className="font-display text-[16px] tracking-wider text-text-secondary uppercase">CURRENT SQUAD LEADERSHIP</h3>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" alt="Captain" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-condensed text-[20px] font-bold text-text-primary uppercase">Zack Miller (You)</h4>
                <div className="flex gap-2 mt-1 items-center">
                  <RoleBadge role="captain" />
                  <span className="font-mono text-[9px] text-text-secondary">ESTABLISHED: MAY 01, 2026</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border-muted/30">
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-text-secondary block">LEADERSHIP SCORE</span>
                <span className="font-display text-[48px] text-accent block leading-none">88 / 100</span>
              </div>
              <div className="space-y-2">
                <BreakdownBar label="Attendance" value={92} />
                <BreakdownBar label="Communication" value={87} />
                <BreakdownBar label="Reliability" value={95} />
                <BreakdownBar label="Squad Approval" value={88} />
                <BreakdownBar label="Event Participation" value={91} />
              </div>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div className="p-6 rounded-[24px] bg-accent-surface/30 border border-accent/20 border-l-[3px] border-l-accent backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={16} />
              <h3 className="font-display text-[16px] uppercase tracking-wider">PULSE ENGINE RECOMMENDATION</h3>
            </div>
            
            <p className="font-mono text-[11px] text-text-secondary leading-relaxed">
              Based on <strong className="text-text-primary">12 matches</strong> of performance analytics, player engagement, and validation logs, the AI recommends <strong className="text-volt">Zaid Al-Hassan</strong> as the primary candidate for Vice Captain promotion due to strong communication and consistency indices.
            </p>

            <div className="p-4 rounded-[16px] bg-elevated border border-border-muted/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" alt="Zaid" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-condensed text-[15px] font-bold text-text-primary uppercase">Zaid Al-Hassan</h4>
                  <span className="font-mono text-[9px] text-accent">Leadership Score: 92/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[8px] text-text-secondary block">STRENGTHS</span>
                <span className="font-mono text-[10px] text-text-primary font-bold block mt-0.5">High Communication · Reliable</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Active Approval Votes */}
        <div className="space-y-6">
          <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-5">
            <div className="space-y-1">
              <h3 className="font-display text-[18px] text-text-primary uppercase tracking-wider">SQUAD VOTE</h3>
              <p className="font-mono text-[10px] text-text-secondary">Vote closes in 48 hours</p>
            </div>

            <div className="p-3 rounded-[12px] bg-elevated border border-border-muted text-center font-mono">
              <span className="text-[9px] text-text-secondary block">REMAINING TIME</span>
              <span className="text-[18px] text-text-primary font-bold block mt-0.5 tracking-widest">{formatTime(timeLeft)}</span>
            </div>

            {/* Live Vote Bar */}
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-success">Approve (8 votes)</span>
                <span className="text-danger">Reject (2 votes)</span>
              </div>
              <div className="flex w-full h-2 rounded-full bg-elevated overflow-hidden">
                <div className="h-full bg-success" style={{ width: '80%' }} />
                <div className="h-full bg-danger" style={{ width: '20%' }} />
              </div>
            </div>

            {/* Member Vote Status */}
            <div className="space-y-2 border-t border-border-muted pt-4">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" alt="Marcus" className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-text-primary">Marcus</span>
                </div>
                <span className="text-success font-bold">Approved</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Priya" className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-text-primary">Priya</span>
                </div>
                <span className="text-text-secondary">Awaiting vote</span>
              </div>
            </div>

            {/* Voting Actions */}
            <div className="space-y-2.5 border-t border-border-muted pt-4">
              {hasVoted ? (
                <div className="p-3.5 rounded-[12px] bg-accent-surface border border-accent/20 text-center font-mono text-[11px] text-accent font-bold">
                  Your vote: {userVote === 'approve' ? 'Approved' : 'Rejected'}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleVote('approve')}
                    className="w-full py-2.5 rounded-[10px] bg-volt text-volt-text font-condensed font-bold text-[13px] tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5 uppercase"
                  >
                    <Check size={14} /> Approve Recommendation
                  </button>
                  <button
                    onClick={() => handleVote('reject')}
                    className="w-full py-2.5 rounded-[10px] bg-elevated border border-border-muted text-text-primary font-condensed font-bold text-[13px] tracking-wider hover:bg-elevated/80 flex items-center justify-center gap-1.5 uppercase"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Squad Roles section */}
      <div className="space-y-4">
        <h3 className="font-display text-[18px] tracking-[3px] text-text-secondary uppercase">
          TACTICAL ROLE DELEGATIONS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { role: 'captain', name: 'Zack Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
            { role: 'vice', name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
            { role: 'strategist', name: 'Zaid Al-Hassan', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
            { role: 'analyst', name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
            { role: 'recruiter', name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
          ].map((item) => (
            <div key={item.role} className="p-4 rounded-[16px] bg-surface border border-border-muted/50 shadow-card text-center space-y-3">
              <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover mx-auto" />
              <div>
                <h5 className="font-condensed font-bold text-[13px] text-text-primary leading-none truncate">{item.name}</h5>
                <div className="mt-2.5">
                  <RoleBadge role={item.role as any} />
                </div>
              </div>
              {isCaptain && (
                <button className="w-full py-1 rounded-[8px] bg-elevated border border-border-muted hover:bg-elevated/80 font-mono text-[9px] text-text-secondary hover:text-text-primary uppercase transition-colors">
                  Assign
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
