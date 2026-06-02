import React from 'react';

type SquadRole = 'captain' | 'vice' | 'strategist' | 'analyst' | 'recruiter' | 'member';

interface RoleBadgeProps {
  role: SquadRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const styles = {
    captain: {
      bg: 'bg-volt-dim',
      text: 'text-accent',
      border: 'border-volt/30',
      label: 'CAPTAIN'
    },
    vice: {
      bg: 'bg-info-dim',
      text: 'text-info',
      border: 'border-info/30',
      label: 'VICE CAPTAIN'
    },
    strategist: {
      bg: 'bg-plasma-dim',
      text: 'text-plasma',
      border: 'border-plasma/30',
      label: 'STRATEGIST'
    },
    analyst: {
      bg: 'bg-warning-dim',
      text: 'text-warning',
      border: 'border-warning/30',
      label: 'ANALYST'
    },
    recruiter: {
      bg: 'bg-success-dim',
      text: 'text-success',
      border: 'border-success/30',
      label: 'RECRUITER'
    },
    member: {
      bg: 'bg-elevated',
      text: 'text-text-secondary',
      border: 'border-border-muted/50',
      label: 'MEMBER'
    }
  }[role] || {
    bg: 'bg-elevated',
    text: 'text-text-secondary',
    border: 'border-border-muted/50',
    label: 'MEMBER'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold tracking-wider ${styles.bg} ${styles.text} ${styles.border}`}>
      {styles.label}
    </span>
  );
};

