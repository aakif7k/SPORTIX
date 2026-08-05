import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquadDetail, useSquadMatches } from '@/hooks/useSquads';
import { Calendar, Award, RefreshCw, ShieldAlert } from 'lucide-react';

const matchDate = (match: { played_at: string | null; created_at: string }) =>
  new Date(match.played_at ?? match.created_at).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export const MatchHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad, loading: squadLoading, error: squadError } = useSquadDetail(id);
  const { matches, loading, error, refresh } = useSquadMatches(id);

  if (squadLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" aria-busy="true" aria-label="Loading squad">
        <div className="h-6 w-1/2 rounded bg-elevated animate-shimmer" />
        <div className="h-12 w-2/3 rounded bg-elevated animate-shimmer" />
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-[20px] bg-surface border border-border-muted/50 animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (squadError || !squad) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          Squad not available
        </p>
        <p className="font-mono text-[11px] text-text-secondary">
          {squadError?.message ?? 'This squad does not exist, or you are not a member of it.'}
        </p>
        <button
          onClick={() => navigate('/pulse')}
          className="px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[11px] font-bold uppercase"
        >
          Back to Pulse
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.$id}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.$id}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.$id}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.$id}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.$id}/settings` }
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
        {loading ? (
          <div aria-busy="true" aria-label="Loading match history" className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex items-center gap-6">
                <div className="w-12 h-12 rounded-[12px] bg-elevated animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-elevated animate-shimmer" />
                  <div className="h-3 w-1/5 rounded bg-elevated animate-shimmer" />
                </div>
                <div className="h-6 w-20 rounded bg-elevated animate-shimmer" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-[16px] border border-border-muted bg-surface shadow-card text-center space-y-3">
            <p className="font-display text-[14px] text-text-primary uppercase tracking-wide">
              Match history did not load
            </p>
            <p className="font-mono text-[11px] text-text-secondary">{error.message}</p>
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 rounded-[16px] border border-border-muted bg-surface shadow-card text-center font-mono text-[12px] text-text-secondary">
            No matches played yet. Schedule a match or enter matchmaking!
          </div>
        ) : (
          matches.map((match) => {
            const isWin = match.outcome === 'W';
            const isLoss = match.outcome === 'L';
            const isPending = match.outcome === null;
            const performer = match.top_performer;

            return (
              <div
                key={match.$id}
                className="p-5 rounded-[20px] bg-surface border border-border-muted/50 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-volt/20 hover:shadow-hover transition-all"
              >
                {/* Left: Outcome and Opponent */}
                <div className="flex items-center gap-4">
                  {/* Big W/L/D Indicator. A match whose result was never entered
                      shows a dash rather than being counted as a draw. */}
                  <div
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center font-display text-[22px] font-bold ${
                      isWin
                        ? 'bg-volt/10 border border-volt text-volt'
                        : isLoss
                        ? 'bg-danger/10 border border-danger text-danger'
                        : isPending
                        ? 'bg-elevated border border-border-muted text-text-secondary'
                        : 'bg-warning/10 border border-warning text-warning'
                    }`}
                  >
                    {match.outcome ?? '–'}
                  </div>
                  <div>
                    <h4 className="font-condensed text-[16px] font-bold text-text-primary uppercase leading-snug">
                      VS {match.opponent_name ?? 'UNNAMED OPPONENT'}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-text-secondary">
                      <Calendar size={12} />
                      <span>{matchDate(match)}</span>
                      {isPending && <span className="text-warning">· result not entered</span>}
                    </div>
                  </div>
                </div>

                {/* Center: Match Score and Chemistry Delta */}
                <div className="flex md:flex-col items-baseline md:items-center justify-between w-full md:w-auto border-t border-b border-border-muted/30 md:border-none py-2.5 md:py-0">
                  <span className="font-display text-[24px] text-text-primary tracking-widest">
                    {match.score ?? '—'}
                  </span>
                  {match.chemistry_delta !== 0 && (
                    <span className={`font-mono text-[10px] font-bold md:mt-1 ${
                      match.chemistry_delta > 0 ? 'text-success' : 'text-danger'
                    }`}>
                      CHEMISTRY {match.chemistry_delta > 0 ? '+' : ''}{match.chemistry_delta}%
                    </span>
                  )}
                </div>

                {/* Right: Top performer */}
                {performer && (
                  <div className="flex items-center gap-3 p-3 rounded-[12px] bg-elevated border border-border-muted/50 max-w-xs w-full md:w-auto">
                    <img
                      src={performer.avatar_url ?? undefined}
                      alt={performer.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-mono text-[8px] text-text-secondary uppercase block flex items-center gap-1">
                        <Award size={10} className="text-accent" /> Top Performer
                      </span>
                      <strong className="font-condensed text-[12px] text-text-primary block mt-0.5">
                        {performer.full_name}
                      </strong>
                      <span className="font-mono text-[10px] text-text-secondary block leading-none">
                        {performer.stats_summary}
                      </span>
                      {/* Unvalidated numbers are shown, but labelled: three
                          teammates have to confirm them before they count. */}
                      {!performer.is_validated && (
                        <span className="font-mono text-[9px] text-warning flex items-center gap-1 mt-1">
                          <ShieldAlert size={9} /> Awaiting validation
                        </span>
                      )}
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
