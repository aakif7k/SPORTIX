import React from 'react';
import type { Squad } from '../../types/pulse.types';
import { ProgressArc } from './ProgressArc';

interface SquadBannerProps {
  squad: Squad;
}

export const SquadBanner: React.FC<SquadBannerProps> = ({ squad }) => {
  const initials = squad.name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const captain = squad.members.find(m => m.uid === squad.captainId) || squad.members[0];

  return (
    <div
      className="relative rounded-[20px] overflow-hidden p-6 md:p-8 bg-surface border border-border-muted/50 shadow-card backdrop-blur-md flex flex-col md:flex-row justify-between gap-6 items-center"
      style={{ minHeight: '200px' }}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-squad" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-text-muted" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-squad)" />
        </svg>
      </div>

      {/* Left: Monogram and Title */}
      <div className="flex flex-col sm:flex-row items-center gap-5 z-10 w-full md:w-auto">
        <div
          className="w-20 h-20 rounded-[20px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--volt-dim), var(--bg-elevated))',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span className="font-display text-[32px] text-volt tracking-wider">
            {initials}
          </span>
          <div className="absolute inset-0 rounded-[20px]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="font-display text-[36px] sm:text-[40px] text-text-primary leading-none tracking-wide">
            {squad.name.toUpperCase()}
          </h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-elevated border border-border-muted/50 font-mono text-[9px] font-bold text-volt">
              {squad.sport.toUpperCase()}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-elevated border border-border-muted/50 font-mono text-[9px] text-success font-bold">
              {squad.winRate}% WR
            </span>
          </div>
          
          {/* Captain details */}
          {captain && (
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <img src={captain.avatar} alt={captain.name} className="w-5 h-5 rounded-full object-cover" />
              <span className="font-mono text-[9px] text-text-secondary">
                Led by <strong className="text-text-primary">{captain.name}</strong>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-volt text-volt-text font-display text-[8px] font-bold">CAPTAIN</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chemistry progress arc */}
      <div className="flex items-center gap-8 z-10 w-full sm:w-auto justify-center sm:justify-end border-t border-border-muted/20 md:border-t-0 pt-6 md:pt-0">
        {/* Core metrics */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-left">
          <div>
            <span className="text-[9px] text-text-secondary block">MATCHES</span>
            <span className="text-[14px] text-text-primary font-bold block">{squad.matchHistory.length + 14}</span>
          </div>
          <div>
            <span className="text-[9px] text-text-secondary block">SQUAD PULSE</span>
            <span className="text-[14px] text-volt font-bold block">{squad.pulseAvg}</span>
          </div>
        </div>

        {/* Big Arc */}
        <div className="flex items-center gap-2">
          <ProgressArc value={squad.chemistry.overall} size={90} strokeWidth={4} label="CHEMISTRY" />
        </div>
      </div>
    </div>
  );
};
