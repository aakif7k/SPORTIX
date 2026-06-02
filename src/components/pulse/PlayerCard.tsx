import React from 'react';
import type { Athlete } from '../../types/pulse.types';
import { RoleBadge } from './RoleBadge';
import { PulseRing } from './PulseRing';
import { useNavigate } from 'react-router-dom';
import { BadgeIcon } from '../gamification/BadgeIcon';

interface PlayerCardProps {
  athlete: Athlete;
  interactive?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  athlete,
  interactive = true,
}) => {
  const navigate = useNavigate();

  const getRoleRingColor = (role?: string) => {
    switch (role) {
      case 'captain': return 'var(--accent)';
      case 'vice': return 'var(--info)';
      case 'strategist': return 'var(--plasma)';
      case 'analyst': return 'var(--warning)';
      case 'recruiter': return 'var(--success)';
      default: return 'var(--border)';
    }
  };

  const getReadinessColor = (ready?: string) => {
    switch (ready) {
      case 'Ready': return 'bg-success';
      case 'Maybe': return 'bg-warning';
      default: return 'bg-danger';
    }
  };

  return (
    <div
      onClick={() => interactive && navigate(`/app/profile/${athlete.uid}`)}
      className={`rounded-[16px] bg-surface border border-border-muted/50 p-4 flex flex-col relative transition-all duration-300 overflow-hidden shadow-card hover:shadow-hover ${
        interactive ? 'cursor-pointer hover:border-volt/20 hover:-translate-y-1' : ''
      }`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 pointer-events-none rounded-bl-full" />

      {/* Top row: Avatar & Basic details */}
      <div className="flex gap-3.5 items-start">
        {/* Avatar with Role Ring */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-black/10"
            style={{ border: `2px solid ${getRoleRingColor(athlete.role)}` }}
          >
            {athlete.avatar ? (
              <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-text-primary text-md">
                {athlete.name.charAt(0)}
              </span>
            )}
          </div>
          {/* Readiness Dot */}
          {athlete.readiness && (
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-surface ${getReadinessColor(athlete.readiness)}`} />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="font-condensed text-[16px] font-bold text-text-primary truncate leading-snug flex items-center gap-1">
            {athlete.name}
            <BadgeIcon level={athlete.level || 25} size={16} animate={false} />
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-wider text-text-secondary">
              Pos: <strong className="text-text-primary">#{athlete.position}</strong>
            </span>
            {athlete.role && athlete.role !== 'member' && (
              <RoleBadge role={athlete.role} />
            )}
          </div>
        </div>
      </div>

      {/* Stats Divider */}
      <div className="my-3.5 h-[1px] bg-border-muted/30" />

      {/* Score & Compatibility */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <PulseRing score={athlete.pulseScore} size="sm" animated={false} />
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] text-text-secondary">PULSE SCORE</span>
            <span className="font-mono text-[8px] text-volt font-bold mt-0.5">{athlete.tier}</span>
          </div>
        </div>

        {athlete.compatibility !== undefined && (
          <div className="text-right">
            <span className="font-mono text-[8px] text-text-secondary block">COMPATIBILITY</span>
            <span className="font-mono text-[11px] font-bold text-text-primary block mt-0.5">{athlete.compatibility}%</span>
          </div>
        )}
      </div>

      {/* Compatibility Bar */}
      {athlete.compatibility !== undefined && (
        <div className="w-full h-1 bg-border-muted/20 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-[#CCFF00] rounded-full"
            style={{ width: `${athlete.compatibility}%` }}
          />
        </div>
      )}
    </div>
  );
};
