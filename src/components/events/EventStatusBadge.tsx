import React from 'react';
import { Check, Lock, Clock, Radio, AlertTriangle } from 'lucide-react';
import { getEventLifecycleState } from '@/services/eventLifecycleService';
import type { Event } from '@/types';

interface EventStatusBadgeProps {
  event: Partial<Event> & Record<string, any>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtext?: boolean;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  event,
  size = 'md',
  className = '',
  showSubtext = false,
}) => {
  const lifecycle = getEventLifecycleState(event);

  let icon = <Clock size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />;
  let badgeClasses = '';

  switch (lifecycle.state) {
    case 'COMPLETED':
      icon = <Check size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} strokeWidth={2.5} />;
      badgeClasses = 'bg-slate-800/80 text-slate-300 border-slate-600/50 shadow-sm';
      break;
    case 'LIVE':
      icon = <Radio size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} className="animate-pulse text-emerald-400" />;
      badgeClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      break;
    case 'REGISTRATION_CLOSED':
      icon = <Lock size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />;
      badgeClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-sm';
      break;
    case 'CANCELLED':
      icon = <AlertTriangle size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />;
      badgeClasses = 'bg-red-950/80 text-red-400 border-red-500/40 shadow-sm';
      break;
    case 'ARCHIVED':
      icon = <Check size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />;
      badgeClasses = 'bg-zinc-800/80 text-zinc-400 border-zinc-600/40';
      break;
    case 'REGISTRATION_OPEN':
    default:
      icon = <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />;
      badgeClasses = 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30 shadow-[0_0_10px_rgba(204,255,0,0.15)]';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs'
      : 'px-2.5 py-1 text-[11px]';

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-wider uppercase rounded-lg border backdrop-blur-md transition-all ${sizeClasses} ${badgeClasses}`}
      >
        {icon}
        <span>{lifecycle.badgeText}</span>
      </div>
      {showSubtext && (
        <span className="text-[10px] font-mono text-text-muted px-0.5">
          {lifecycle.badgeSubtext}
        </span>
      )}
    </div>
  );
};
