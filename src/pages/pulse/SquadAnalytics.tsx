import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquad } from '../../hooks/useSquad';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Zap, Calendar } from 'lucide-react';

export const SquadAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad } = useSquad(id);

  if (!squad) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono">
        Squad not found.
      </div>
    );
  }

  // 1. Pulse Score Over Time Data
  const pulseOverTimeData = [
    { name: 'Match 1', Marcus: 830, Zaid: 780, Aisha: 800, Zack: 710 },
    { name: 'Match 2', Marcus: 835, Zaid: 782, Aisha: 805, Zack: 715 },
    { name: 'Match 3', Marcus: 842, Zaid: 790, Aisha: 809, Zack: 721 },
    { name: 'Match 4', Marcus: 847, Zaid: 793, Aisha: 812, Zack: 721 },
  ];

  // 2. Chemistry Evolution Data
  const chemistryEvolutionData = [
    { name: 'M1', chemistry: 72 },
    { name: 'M2', chemistry: 75 },
    { name: 'M3', chemistry: 76 },
    { name: 'M4', chemistry: 78 },
    { name: 'M5', chemistry: 81 },
    { name: 'M6', chemistry: 80 },
    { name: 'M7', chemistry: 82 },
    { name: 'M8', chemistry: 84 },
    { name: 'M9', chemistry: 86 },
    { name: 'M10', chemistry: 87 },
  ];

  // 3. Position Balance Radar Data
  const positionBalanceData = [
    { subject: 'Attack', A: 85, fullMark: 100 },
    { subject: 'Defense', A: 70, fullMark: 100 },
    { subject: 'Midfield', A: 90, fullMark: 100 },
    { subject: 'Goalkeeping', A: 80, fullMark: 100 },
    { subject: 'Leadership', A: 85, fullMark: 100 },
  ];

  // 4. Member Contribution Data
  const contributionData = [
    { name: 'Marcus', value: 34 },
    { name: 'Aisha', value: 22 },
    { name: 'Zaid', value: 18 },
    { name: 'Zack (You)', value: 15 },
    { name: 'Devon', value: 7 },
    { name: 'Priya', value: 4 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.squadId}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.squadId}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.squadId}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.squadId}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.squadId}/settings` }
  ];

  // Reusable custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border-muted rounded-[10px] p-3 font-mono text-[10px] space-y-1 shadow-card">
          <p className="text-text-primary font-bold">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color || 'var(--accent)' }}>
              {p.name}: <strong className="text-text-primary">{p.value}%</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Subnav */}
      <div className="flex gap-1.5 border-b border-border-muted pb-px font-mono text-[11px] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 border-b-2 font-bold tracking-wider transition-colors ${
              tab.id === 'analytics'
                ? 'border-volt text-volt'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none uppercase text-text-primary">SQUAD ANALYTICS</h1>
          <p className="font-mono text-[11px] text-text-secondary mt-1">
            Visualizing performance trends for <strong className="text-volt">{squad.name}</strong>
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border-muted/50 shadow-card font-mono text-[10px] text-text-secondary">
          <Calendar size={12} />
          <span>Last 14 days</span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card">
          <span className="font-mono text-[9px] text-text-secondary uppercase">Win Rate</span>
          <span className="font-display text-[26px] text-accent block mt-1">{squad.winRate}%</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card">
          <span className="font-mono text-[9px] text-text-secondary uppercase">Avg Pulse Score</span>
          <span className="font-display text-[26px] text-text-primary block mt-1">{squad.pulseAvg}</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card">
          <span className="font-mono text-[9px] text-text-secondary uppercase">Chemistry Trend</span>
          <span className="font-display text-[26px] text-success block mt-1">+15%</span>
        </div>
        <div className="p-5 rounded-[16px] bg-surface border border-border-muted/50 shadow-card">
          <span className="font-mono text-[9px] text-text-secondary uppercase">Matches Played</span>
          <span className="font-display text-[26px] text-text-primary block mt-1">{squad.matchHistory.length + 14}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Pulse Score Over Time */}
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">PULSE SCORE TRENDS</h3>
            <span className="font-mono text-[9px] text-accent">INDIVIDUAL STABILITY</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pulseOverTimeData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} domain={[600, 900]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Marcus" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} name="Marcus" />
                <Line type="monotone" dataKey="Zaid" stroke="var(--info)" strokeWidth={2} dot={{ r: 3 }} name="Zaid" />
                <Line type="monotone" dataKey="Aisha" stroke="var(--plasma)" strokeWidth={2} dot={{ r: 3 }} name="Aisha" />
                <Line type="monotone" dataKey="Zack" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="Zack" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Chemistry Evolution */}
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">CHEMISTRY EVOLUTION</h3>
            <span className="font-mono text-[9px] text-success">Overall Target 80%</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chemistryEvolutionData}>
                <defs>
                  <linearGradient id="colorChem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} domain={[50, 100]} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="chemistry" stroke="var(--accent)" fillOpacity={1} fill="url(#colorChem)" strokeWidth={2} name="Chemistry" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Position Balance (Radar) */}
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">POSITION COVERAGE</h3>
            <span className="font-mono text-[9px] text-text-secondary">TACTICAL DEPTH</span>
          </div>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={positionBalanceData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" fontSize={8} />
                <Radar name="Squad Depth" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Member Contribution */}
        <div className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] tracking-wider text-text-secondary uppercase">MEMBER CONTRIBUTION TO WINS</h3>
            <span className="font-mono text-[9px] text-text-secondary">IMPACT RATING</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent-surface)" stroke="var(--accent)" strokeWidth={1} radius={[4, 4, 0, 0]} name="Win Impact %">
                  {contributionData.map((_, index) => (
                    <rect
                      key={`rect-${index}`}
                      fill={index === 0 ? 'var(--accent)' : 'var(--accent-surface)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* AI Insights Panel */}
      <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-2">
          <Zap className="text-accent" size={16} />
          <h3 className="font-display text-[16px] text-text-primary">PULSE ENGINE INSIGHTS</h3>
        </div>

        <ul className="space-y-2.5 font-mono text-[12px] text-text-secondary">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
            <span><strong className="text-text-primary">12%</strong> after retaining core 7 members for 6+ matches.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
            <span><strong className="text-text-primary">Marcus Reid</strong> contributes 34% of match-winning plays, highlighting ST position dependency.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
            <span>Squad performs <strong className="text-text-primary">28% better</strong> when communications frequency in squad chat matches baseline indices.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-volt mt-1.5" />
            <span>Low Block defense is highly optimized; recommendation: maintain <strong className="text-text-primary">4-3-3</strong> formation.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
