import React, { useState } from 'react';
import { useSquad } from '../../hooks/useSquad';
import { Trophy, Calendar, Users, Check, MapPin } from 'lucide-react';

export const TournamentHub: React.FC = () => {
  const { squads } = useSquad();
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedSquadId, setSelectedSquadId] = useState<string>('');
  const [registeredSquads, setRegisteredSquads] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'standings' | 'bracket'>('standings');

  const handleRegisterClick = () => {
    // Automatically select the first squad if available
    if (squads.length > 0) {
      setSelectedSquadId(squads[0].squadId);
    }
    setShowRegModal(true);
  };

  const handleConfirmRegistration = () => {
    if (selectedSquadId) {
      setRegisteredSquads((prev) => [...prev, selectedSquadId]);
      setShowRegModal(false);
    }
  };

  const standings = [
    { pos: 1, name: 'Vanguard FC', w: 8, l: 1, diff: '+12', pulse: 852, pts: 24 },
    { pos: 2, name: 'Iron Pulse FC (You)', w: 7, l: 2, diff: '+8', pulse: 810, pts: 21 },
    { pos: 3, name: 'Metro Stars', w: 6, l: 3, diff: '+4', pulse: 790, pts: 18 },
    { pos: 4, name: 'Nova Rangers', w: 5, l: 4, diff: '0', pulse: 755, pts: 15 },
    { pos: 5, name: 'Summit United', w: 4, l: 5, diff: '-2', pulse: 730, pts: 12 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative text-text-primary">
      {/* Featured Tournament Banner */}
      <div className="relative rounded-[24px] overflow-hidden p-6 md:p-8 bg-elevated border border-border-muted backdrop-blur-md flex flex-col md:flex-row justify-between gap-6 items-center shadow-card">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-grid-sm" />
        
        <div className="space-y-3 z-10 text-center md:text-left">
          <span className="px-2.5 py-0.5 rounded-full bg-volt-dim border border-volt/20 font-mono text-[9px] text-volt font-bold uppercase tracking-wider">
            FEATURED CHAMPIONSHIP
          </span>
          <h1 className="font-display text-[44px] sm:text-[52px] leading-none uppercase tracking-wide">
            METRO LEAGUE OPEN
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 font-mono text-[10px] text-text-secondary">
            <span className="flex items-center gap-1"><Calendar size={12} /> May 25 – June 10</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> City Sports Complex</span>
            <span className="flex items-center gap-1"><Users size={12} /> 14 / 16 Slots Taken</span>
          </div>
        </div>

        <div className="flex-shrink-0 z-10 flex flex-col items-center md:items-end gap-3.5">
          <div className="text-center md:text-right font-mono">
            <span className="text-[9px] text-text-secondary block">PRIZE POOL</span>
            <span className="text-[20px] text-volt font-bold block mt-0.5">$5,000 USD</span>
          </div>
          {registeredSquads.includes(squads[0]?.squadId) ? (
            <div className="px-5 py-2.5 rounded-[12px] bg-success-dim border border-success/20 text-success font-condensed font-bold text-[14px] uppercase flex items-center gap-1.5">
              <Check size={16} /> Registered
            </div>
          ) : (
            <button
              onClick={handleRegisterClick}
              className="px-5 py-2.5 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[14px] uppercase tracking-wider hover:scale-105 transition-all"
            >
              Register Squad →
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Standing and Bracket Tab Switcher */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-border-muted pb-3">
            <h3 className="font-display text-[18px] text-text-primary uppercase tracking-wider">TOURNAMENT STANDINGS</h3>
            <div className="flex gap-1.5 p-0.5 rounded-[8px] bg-elevated border border-border-muted font-mono text-[9px]">
              <button
                onClick={() => setActiveView('standings')}
                className={`px-3 py-1.5 rounded-[6px] font-bold uppercase transition-all ${
                  activeView === 'standings' ? 'bg-volt text-volt-text' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Standings
              </button>
              <button
                onClick={() => setActiveView('bracket')}
                className={`px-3 py-1.5 rounded-[6px] font-bold uppercase transition-all ${
                  activeView === 'bracket' ? 'bg-volt text-volt-text' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Brackets
              </button>
            </div>
          </div>

          {activeView === 'standings' ? (
            <div className="overflow-x-auto rounded-[20px] bg-surface border border-border-muted shadow-card">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-border-muted text-text-secondary text-[9px] uppercase">
                    <th className="p-4 w-12 text-center">POS</th>
                    <th className="p-4">SQUAD</th>
                    <th className="p-4 text-center">W</th>
                    <th className="p-4 text-center">L</th>
                    <th className="p-4 text-center">DIFF</th>
                    <th className="p-4 text-center">PULSE</th>
                    <th className="p-4 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => {
                    const isMe = row.name.includes('(You)');
                    return (
                      <tr
                        key={row.pos}
                        className={`border-b border-border-muted/50 ${isMe ? 'bg-volt-dim text-volt' : ''}`}
                      >
                        <td className="p-4 font-bold text-center">{row.pos}</td>
                        <td className="p-4 font-bold text-text-primary uppercase">{row.name}</td>
                        <td className="p-4 text-center">{row.w}</td>
                        <td className="p-4 text-center">{row.l}</td>
                        <td className="p-4 text-center">{row.diff}</td>
                        <td className="p-4 text-center text-volt font-bold">{row.pulse}</td>
                        <td className="p-4 font-bold text-center text-text-primary">{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Simple Bracket Tree rendering */
            <div className="p-6 rounded-[20px] bg-surface border border-border-muted flex flex-col md:flex-row justify-between gap-8 items-center overflow-x-auto shadow-card">
              
              {/* Quarterfinals */}
              <div className="space-y-8 min-w-[150px]">
                <div className="p-3.5 rounded-[12px] bg-elevated border border-border-muted space-y-1">
                  <span className="font-mono text-[8px] text-text-secondary block">Q1</span>
                  <div className="font-condensed font-bold text-[12px] text-text-primary">Vanguard FC (2)</div>
                  <div className="font-condensed font-bold text-[12px] text-text-secondary">Metro Stars (1)</div>
                </div>
                <div className="p-3.5 rounded-[12px] bg-elevated border border-border-muted space-y-1">
                  <span className="font-mono text-[8px] text-text-secondary block">Q2</span>
                  <div className="font-condensed font-bold text-[12px] text-volt">Iron Pulse (3)</div>
                  <div className="font-condensed font-bold text-[12px] text-text-secondary">Nova Rangers (0)</div>
                </div>
              </div>

              {/* Connector */}
              <div className="hidden md:block w-8 h-[1px] bg-border-muted" />

              {/* Semifinals */}
              <div className="space-y-12 min-w-[150px]">
                <div className="p-3.5 rounded-[12px] bg-volt-dim border border-volt/20 space-y-1">
                  <span className="font-mono text-[8px] text-volt block font-bold">SEMIFINAL</span>
                  <div className="font-condensed font-bold text-[12px] text-text-primary">Vanguard FC</div>
                  <div className="font-condensed font-bold text-[12px] text-volt">Iron Pulse FC</div>
                </div>
              </div>

              {/* Connector */}
              <div className="hidden md:block w-8 h-[1px] bg-border-muted" />

              {/* Finals */}
              <div className="min-w-[150px]">
                <div className="p-5 rounded-[16px] bg-volt-dim border border-volt/30 text-center space-y-2 shadow-card">
                  <Trophy className="mx-auto text-volt" size={20} fill="currentColor" />
                  <span className="font-mono text-[8px] text-volt block font-bold">FINALS</span>
                  <div className="font-condensed font-bold text-[14px] text-text-primary uppercase">MATCH PENDING</div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Side: Other tournaments list */}
        <div className="space-y-6">
          <h3 className="font-display text-[18px] text-text-primary uppercase tracking-wider">UPCOMING CUPS</h3>

          <div className="space-y-4">
            <div className="p-5 rounded-[20px] bg-surface border border-border-muted space-y-3.5 shadow-card">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded bg-elevated border border-border-muted font-mono text-[8px] text-text-secondary">
                  REGISTERING
                </span>
                <span className="font-mono text-[9px] text-volt font-bold">4 slots left</span>
              </div>
              <div>
                <h4 className="font-condensed text-[16px] font-bold text-text-primary uppercase leading-snug">
                  Heritage League Cup
                </h4>
                <p className="font-mono text-[10px] text-text-secondary mt-1">June 15 – June 30 · Cricket</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border-muted text-[10px] font-mono">
                <span className="text-text-secondary">Prize: $2,500</span>
                <button className="px-3.5 py-1.5 rounded-[8px] bg-elevated border border-border-muted hover:bg-hover text-text-primary font-condensed font-bold transition-colors">
                  Register
                </button>
              </div>
            </div>

            <div className="p-5 rounded-[20px] bg-surface border border-border-muted space-y-3.5 opacity-60 shadow-card">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded bg-elevated border border-border-muted font-mono text-[8px] text-text-secondary">
                  IN-PROGRESS
                </span>
              </div>
              <div>
                <h4 className="font-condensed text-[16px] font-bold text-text-primary uppercase leading-snug">
                  Sunset City 3v3
                </h4>
                <p className="font-mono text-[10px] text-text-secondary mt-1">Ongoing · Basketball</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border-muted text-[10px] font-mono">
                <span className="text-text-secondary">Prize: $1,500</span>
                <span className="text-text-secondary font-bold">Ongoing</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Registration Modal Dialog */}
      {showRegModal && (
        <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md p-6 rounded-[24px] bg-surface border border-border-muted space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="font-display text-[22px] text-text-primary uppercase">Register Squad</h3>
              <p className="font-mono text-[11px] text-text-secondary">Select an active squad under your captaincy to submit registration.</p>
            </div>

            <div className="space-y-3">
              {squads.map((s) => (
                <div
                  key={s.squadId}
                  onClick={() => setSelectedSquadId(s.squadId)}
                  className={`p-4 rounded-[16px] border cursor-pointer transition-colors ${
                    selectedSquadId === s.squadId
                      ? 'bg-volt-dim border-volt'
                      : 'bg-elevated border-border-muted hover:border-volt/30'
                  }`}
                >
                  <h4 className="font-condensed text-[14px] font-bold text-text-primary uppercase">{s.name}</h4>
                  <span className="font-mono text-[9px] text-volt">{s.sport.toUpperCase()} · Avg Pulse {s.pulseAvg}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 font-condensed">
              <button
                onClick={handleConfirmRegistration}
                className="flex-1 py-3 rounded-[12px] bg-volt text-volt-text font-bold text-[14px] uppercase hover:scale-102 transition-transform"
              >
                Confirm Registration
              </button>
              <button
                onClick={() => setShowRegModal(false)}
                className="flex-1 py-3 rounded-[12px] bg-elevated border border-border-muted text-text-primary font-bold text-[14px] uppercase hover:bg-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
