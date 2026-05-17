import React from 'react';

// ─── SKELETON ─────────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; }
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton rounded ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="glass rounded-xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-32 w-full rounded-lg" />
  </div>
);

export const SkeletonAthleteCard: React.FC = () => (
  <div className="glass rounded-xl p-4 space-y-3">
    <Skeleton className="h-24 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// ─── TOGGLE ────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => (
  <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} />
      <div className={`w-11 h-6 rounded-full transition-all duration-300 neuo-inset ${checked ? 'bg-volt/20' : 'bg-surface'} border ${checked ? 'border-volt/40' : 'border-border-muted'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 shadow-md ${checked ? 'left-6 bg-volt shadow-glow-volt-sm' : 'left-1 bg-text-muted'}`} />
      </div>
    </div>
    {label && <span className="text-sm font-label text-text-secondary">{label}</span>}
  </label>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'volt' | 'orange' | 'purple';
}
const colorMap = {
  volt: 'bg-volt shadow-glow-volt-sm',
  orange: 'bg-hot shadow-glow-orange-sm',
  purple: 'bg-purple-500 shadow-glow-purple',
};
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, showValue, color = 'volt' }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="stat-label">{label}</span>}
          {showValue && <span className="font-mono text-xs text-volt">{value}</span>}
        </div>
      )}
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden neuo-inset">
        <div className={`h-full rounded-full transition-all duration-700 ${colorMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── STAT PANEL ────────────────────────────────────────────────────────────
interface StatPanelProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
  blinking?: boolean;
}
export const StatPanel: React.FC<StatPanelProps> = ({ label, value, trend, unit, blinking }) => (
  <div className="telemetry-card rounded-lg p-3 text-center">
    <div className={`font-mono text-xl font-bold text-volt ${blinking ? 'animate-pulse' : ''}`}>
      {value}{unit && <span className="text-sm text-text-secondary ml-0.5">{unit}</span>}
    </div>
    <div className="stat-label mt-1">{label}</div>
    {trend && (
      <div className={`text-xs mt-1 font-mono ${trend === 'up' ? 'text-volt' : trend === 'down' ? 'text-hot' : 'text-text-secondary'}`}>
        {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}
      </div>
    )}
  </div>
);

// ─── SPINNER ───────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin text-volt ${className}`}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ─── COUNT UP NUMBER ───────────────────────────────────────────────────────
export const CountUpNumber: React.FC<{ value: number; duration?: number; className?: string }> = ({ value, duration = 1500, className = '' }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = value;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span className={className}>{display.toLocaleString()}</span>;
};
