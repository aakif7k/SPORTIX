import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquad } from '../../hooks/useSquad';
import { Calendar, Award } from 'lucide-react';

export const MatchHistory: React.FC = () => {
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

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.squadId}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.squadId}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.squadId}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.squadId}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.squadId}/settings` }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Subnav */}
      <div className="flex gap-1.5 border-b border-border-muted pb-px font-mono text-[11px] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 border-b-2 font-bold tracking-wider transition-colors ${
              tab.id === 'history'
                ? 'border-volt text-volt'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-[44px] leading-none uppercase text-text-primary">MATCH HISTORY</h1>
        <p className="font-mono text-[11px] text-text-secondary mt-1">
          Historical log of matches played by <strong className="text-volt">{squad.name}</strong>
        </p>
      </div>

      {/* Matches list */}
      <div className="space-y-4">
        {squad.matchHistory.length === 0 ? (
          <div className="p-12 rounded-3xl border border-border-muted bg-surface text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-elevated border border-border-muted flex items-center justify-center mx-auto text-volt">
              <Award size={22} />
            </div>
            <p className="font-sans font-bold text-sm text-text-primary">
              Play a match to build your history.
            </p>
            <p className="font-mono text-xs text-text-secondary">
              Schedule a match or enter matchmaking to build your squad's history.
            </p>
          </div>
        ) : (
          squad.matchHistory.map((match) => {
            const isWin = match.result === 'W';
            const isLoss = match.result === 'L';
            
            return (
              <div
                key={match.matchId}
                className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-volt/20 hover:shadow-hover transition-all"
              >
                {/* Left: Outcome and Opponent */}
                <div className="flex items-center gap-4">
                  {/* Big W/L/D Indicator */}
                  <div
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center font-display text-[22px] font-bold ${
                      isWin
                        ? 'bg-volt/10 border border-volt text-volt'
                        : isLoss
                        ? 'bg-danger/10 border border-danger text-danger'
                        : 'bg-warning/10 border border-warning text-warning'
                    }`}
                  >
                    {match.result}
                  </div>
                  <div>
                    <h4 className="font-condensed text-[16px] font-bold text-text-primary uppercase leading-snug">
                      VS {match.opponentName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-text-secondary">
                      <Calendar size={12} />
                      <span>{match.date}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Match Score and Chemistry Delta */}
                <div className="flex md:flex-col items-baseline md:items-center justify-between w-full md:w-auto border-t border-b border-border-muted/30 md:border-none py-2.5 md:py-0">
                  <span className="font-display text-[24px] text-text-primary tracking-widest">{match.score}</span>
                  <span className="font-mono text-[10px] text-success font-bold md:mt-1">
                    CHEMISTRY +{match.chemistryDelta}%
                  </span>
                </div>

                {/* Right: Top performer */}
                {match.topPerformer && (
                  <div className="flex items-center gap-3 p-3 rounded-[12px] bg-elevated border border-border-muted/50 max-w-xs w-full md:w-auto">
                    <img
                      src={match.topPerformer.avatar}
                      alt={match.topPerformer.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-mono text-[8px] text-text-secondary uppercase block flex items-center gap-1">
                        <Award size={10} className="text-accent" /> Top Performer
                      </span>
                      <strong className="font-condensed text-[12px] text-text-primary block mt-0.5">
                        {match.topPerformer.name}
                      </strong>
                      <span className="font-mono text-[10px] text-text-secondary block leading-none">
                        {match.topPerformer.statsSummary}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
