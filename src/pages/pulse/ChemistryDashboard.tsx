import React from 'react';
import { useSquad } from '../../hooks/useSquad';
import { useChemistry } from '../../hooks/useChemistry';
import { ProgressArc } from '../../components/pulse/ProgressArc';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

export const ChemistryDashboard: React.FC = () => {
  const { squad } = useSquad();
  const { getCompatibilityGrid } = useChemistry();

  if (!squad) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        Squad not found.
      </div>
    );
  }

  const chemistryEvolutionData = [
    { name: 'M5', chemistry: 72 },
    { name: 'M6', chemistry: 75 },
    { name: 'M7', chemistry: 76 },
    { name: 'M8', chemistry: 78 },
    { name: 'M9', chemistry: 81 },
    { name: 'M10', chemistry: 80 },
    { name: 'M11', chemistry: 82 },
    { name: 'M12', chemistry: 84 },
    { name: 'M13', chemistry: 86 },
    { name: 'M14', chemistry: 87 },
  ];

  const compatibilityMatrix = getCompatibilityGrid();

  const factors = [
    { name: 'Teammate Retention', score: '89%', trend: '↑ +4%', desc: 'Retaining 7 core members stabilization effect.' },
    { name: 'Communication Activity', score: '78%', trend: '↑ +1.2%', desc: 'Consistent secure chat channel interaction index.' },
    { name: 'Performance Consistency', score: '92%', trend: '↑ +0.8%', desc: 'Stable statistics across all position variables.' },
    { name: 'Teammate Approval', score: '88%', trend: '↓ -2%', desc: 'Post-match validations consensus percentage.' },
  ];

  const getCellColor = (val: number) => {
    if (val >= 90) return 'bg-accent text-volt-text shadow-glow-volt-sm';
    if (val >= 75) return 'bg-success/20 text-success border border-success/30';
    if (val >= 60) return 'bg-warning/20 text-warning border border-warning/30';
    return 'bg-danger/20 text-danger border border-danger/30';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[56px] leading-none uppercase text-text-primary">CHEMISTRY DASHBOARD</h1>
        <p className="font-mono text-[11px] text-text-secondary mt-1">
          Deep diagnostic breakdown of <strong className="text-volt">{squad.name}</strong> · Last updated after Match 14
        </p>
      </div>

      {/* Top metrics panels */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card flex flex-col items-center text-center justify-center">
          <ProgressArc value={87} size={70} strokeWidth={3} color="var(--accent)" />
          <span className="font-mono text-[8px] text-text-secondary mt-2">CHEMISTRY</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card flex flex-col items-center text-center justify-center">
          <ProgressArc value={91} size={70} strokeWidth={3} color="var(--success)" />
          <span className="font-mono text-[8px] text-text-secondary mt-2">TRUST INDEX</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card text-center flex flex-col justify-center">
          <span className="font-mono text-[8px] text-text-secondary block">COMMUNICATION</span>
          <span className="font-display text-[22px] text-info block mt-1">STRONG</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card text-center flex flex-col justify-center">
          <span className="font-mono text-[8px] text-text-secondary block">COORDINATION</span>
          <span className="font-display text-[22px] text-accent block mt-1">ELITE</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card text-center flex flex-col justify-center col-span-2 md:col-span-1">
          <span className="font-mono text-[8px] text-text-secondary block">TEAM PULSE</span>
          <span className="font-display text-[26px] text-text-primary block mt-1">934</span>
        </div>
      </div>

      {/* Chart & Compatibility Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chemistry Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">CHEMISTRY EVOLUTION CHART</h3>
            <span className="font-mono text-[9px] text-accent">STABLE PROFILE</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chemistryEvolutionData}>
                <defs>
                  <linearGradient id="chemColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} domain={[60, 100]} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text-primary)' }} cursor={{ fill: 'var(--bg-hover)' }} />
                <ReferenceLine y={80} stroke="var(--border)" strokeDasharray="3 3" label={{ value: 'Target Threshold', fill: 'var(--text-muted)', fontSize: 8 }} />
                <Area type="monotone" dataKey="chemistry" stroke="var(--accent)" fillOpacity={1} fill="url(#chemColor)" strokeWidth={2} name="Chemistry" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compatibility Matrix */}
        <div className="p-6 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">COMPATIBILITY MATRIX</h3>
            <span className="font-mono text-[9px] text-text-secondary">PAIRS DIAGNOSTIC</span>
          </div>
          
          <div className="space-y-3">
            {/* Headers */}
            <div className="flex gap-1">
              <div className="w-10 flex-shrink-0" />
              {squad.members.map((m, idx) => (
                <div key={idx} className="w-8 text-center font-mono text-[8px] text-text-secondary truncate">
                  {m.name.charAt(0)}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {squad.members.map((rowMember, rIdx) => (
              <div key={rIdx} className="flex gap-1 items-center">
                <div className="w-10 flex-shrink-0 font-mono text-[8px] text-text-secondary truncate leading-none">
                  {rowMember.name.split(' ')[0]}
                </div>
                {squad.members.map((colMember, cIdx) => {
                  const val = compatibilityMatrix[rIdx]?.[cIdx] || 85;
                  return (
                    <div
                      key={cIdx}
                      className={`w-8 h-8 rounded flex items-center justify-center font-mono text-[9px] font-bold group relative cursor-help ${getCellColor(val)}`}
                    >
                      {val}%
                      
                      {/* Matrix Cell Tooltip */}
                      <div className="absolute z-30 bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-40 p-2 bg-elevated border border-border-muted rounded-[8px] text-[8px] font-mono text-text-secondary pointer-events-none hidden group-hover:block text-center leading-normal shadow-2xl">
                        <strong className="text-text-primary block mb-0.5">{rowMember.name.split(' ')[0]} + {colMember.name.split(' ')[0]}</strong>
                        Compatibility: {val}%<br/>
                        8 matches together
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Factors grid & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Factors */}
        <div className="grid grid-cols-2 gap-4">
          {factors.map((f, idx) => (
            <div key={idx} className="p-4 rounded-[16px] bg-surface border border-border-muted/50 shadow-card space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] text-text-secondary uppercase">{f.name}</span>
                <span className="font-mono text-[9px] text-success font-bold">{f.trend}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[24px] text-text-primary">{f.score}</span>
              </div>
              <p className="font-mono text-[9px] text-text-secondary leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="text-accent" size={16} />
            <h3 className="font-display text-[16px] text-text-primary">AI CHEMISTRY INSIGHTS</h3>
          </div>
          <ul className="space-y-3 font-mono text-[12px] text-text-secondary">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
              <span>Your squad chemistry peaks after <strong className="text-text-primary">3+ consecutive wins</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
              <span>Low coordination segments (GK-CB) resolved with Priya Nair readiness updates.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
              <span>Average communication metrics are 12% above standard league defaults.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
