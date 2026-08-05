import React, { useState } from 'react';
import { useMySquads } from '@/hooks/useSquads';
import { useAuth } from '@/context/AuthContext';
import { useTournaments, useTournament, useTournamentEntry } from '@/hooks/useTournaments';
import { Trophy, Calendar, Users, Check, MapPin, RefreshCw } from 'lucide-react';
import type { ApiBracketMatch } from '@/types/api.types';

const dateRange = (from: string | null, to: string | null) => {
  const fmt = (v: string) =>
    new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (!from) return 'Dates to be confirmed';
  return to ? `${fmt(from)} – ${fmt(to)}` : fmt(from);
};

export const TournamentHub: React.FC = () => {
  const { user } = useAuth();
  const { squads } = useMySquads();
  const { tournaments, loading, error, refresh } = useTournaments();
  const { registerSquad, withdrawSquad, entering } = useTournamentEntry();

  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedSquadId, setSelectedSquadId] = useState<string>('');
  const [activeView, setActiveView] = useState<'standings' | 'bracket'>('standings');
  const [featuredId, setFeaturedId] = useState<string | null>(null);

  // The featured championship is the soonest one still open, since that is the
  // one a user can act on; the list is already ordered by start date.
  const featured = tournaments.find(t => t.$id === featuredId)
    ?? tournaments.find(t => t.status === 'registering' || t.status === 'full')
    ?? tournaments[0]
    ?? null;

  const { tournament: detail, loading: detailLoading, error: detailError, refresh: refreshDetail } =
    useTournament(featured?.$id);

  const others = tournaments.filter(t => t.$id !== featured?.$id);
  // Entering is captain-only on the server, and the sport has to match, so the
  // picker offers exactly the squads that will be accepted rather than letting
  // someone choose one and collect a 403.
  const eligibleSquads = squads.filter(s =>
    featured && s.sport === featured.sport && s.captain_id === user?.id);

  const handleRegisterClick = () => {
    setSelectedSquadId(eligibleSquads[0]?.$id ?? '');
    setShowRegModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!selectedSquadId || !featured) return;
    try {
      await registerSquad({ tournamentId: featured.$id, squadId: selectedSquadId });
      setShowRegModal(false);
      refreshDetail();
    } catch {
      // useTournamentEntry surfaced the reason; the modal stays open so the
      // choice is not lost.
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8" aria-busy="true" aria-label="Loading tournaments">
        <div className="h-44 rounded-[24px] bg-elevated border border-border-muted animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 rounded-[20px] bg-surface border border-border-muted animate-shimmer" />
          <div className="h-72 rounded-[20px] bg-surface border border-border-muted animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          Tournaments did not load
        </p>
        <p className="font-mono text-[11px] text-text-secondary">{error.message}</p>
        <button
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-[14px] bg-elevated border border-border-muted flex items-center justify-center text-text-secondary">
          <Trophy size={20} />
        </div>
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          No tournaments yet
        </p>
        <p className="font-mono text-[11px] text-text-secondary">
          Nothing is open for entry right now. Check back when a cup is announced.
        </p>
      </div>
    );
  }

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
            {featured.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 font-mono text-[10px] text-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {dateRange(featured.starts_at, featured.ends_at)}
            </span>
            {featured.venue && (
              <span className="flex items-center gap-1"><MapPin size={12} /> {featured.venue}</span>
            )}
            <span className="flex items-center gap-1">
              <Users size={12} /> {featured.squads_count} / {featured.max_squads} Slots Taken
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 z-10 flex flex-col items-center md:items-end gap-3.5">
          {featured.prize_pool && (
            <div className="text-center md:text-right font-mono">
              <span className="text-[9px] text-text-secondary block">PRIZE POOL</span>
              <span className="text-[20px] text-volt font-bold block mt-0.5">{featured.prize_pool}</span>
            </div>
          )}
          {featured.is_registered ? (
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="px-5 py-2.5 rounded-[12px] bg-success-dim border border-success/20 text-success font-condensed font-bold text-[14px] uppercase flex items-center gap-1.5">
                <Check size={16} /> Registered
              </div>
              {featured.status !== 'in_progress' && featured.status !== 'completed' && (
                <button
                  onClick={() => withdrawSquad({
                    tournamentId: featured.$id,
                    squadId: featured.my_registered_squad_ids[0],
                  }).then(() => refreshDetail())}
                  disabled={entering}
                  className="font-mono text-[9px] text-text-secondary hover:text-danger uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Withdraw squad
                </button>
              )}
            </div>
          ) : featured.status === 'registering' ? (
            <button
              onClick={handleRegisterClick}
              className="px-5 py-2.5 rounded-[12px] bg-volt text-volt-text font-condensed font-bold text-[14px] uppercase tracking-wider hover:scale-105 transition-all"
            >
              Register Squad →
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-[12px] bg-elevated border border-border-muted text-text-secondary font-condensed font-bold text-[14px] uppercase">
              {featured.status === 'full' ? 'Entries Full' : featured.status.replace('_', ' ')}
            </div>
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

          {detailLoading ? (
            <div className="h-64 rounded-[20px] bg-surface border border-border-muted animate-shimmer"
                 aria-busy="true" aria-label="Loading standings" />
          ) : detailError ? (
            <div className="p-8 rounded-[20px] bg-surface border border-border-muted shadow-card text-center space-y-3">
              <p className="font-display text-[14px] text-text-primary uppercase tracking-wide">
                Standings did not load
              </p>
              <p className="font-mono text-[11px] text-text-secondary">{detailError.message}</p>
              <button
                onClick={() => refreshDetail()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : activeView === 'standings' ? (
            (detail?.standings.length ?? 0) === 0 ? (
              <div className="p-8 rounded-[20px] bg-surface border border-border-muted shadow-card text-center font-mono text-[12px] text-text-secondary">
                No squads have entered yet. Standings appear once the first match is played.
              </div>
            ) : (
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
                    {detail!.standings.map((row) => {
                      const isMe = featured.my_registered_squad_ids.includes(row.squad_id);
                      return (
                        <tr
                          key={row.squad_id}
                          className={`border-b border-border-muted/50 ${isMe ? 'bg-volt-dim text-volt' : ''}`}
                        >
                          <td className="p-4 font-bold text-center">{row.position}</td>
                          <td className="p-4 font-bold text-text-primary uppercase">
                            {row.name}{isMe && ' (You)'}
                          </td>
                          <td className="p-4 text-center">{row.wins}</td>
                          <td className="p-4 text-center">{row.losses}</td>
                          <td className="p-4 text-center">
                            {row.difference > 0 ? `+${row.difference}` : row.difference}
                          </td>
                          <td className="p-4 text-center text-volt font-bold">{Math.round(row.pulse_avg)}</td>
                          <td className="p-4 font-bold text-center text-text-primary">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (detail?.bracket.length ?? 0) === 0 ? (
            <div className="p-8 rounded-[20px] bg-surface border border-border-muted shadow-card text-center font-mono text-[12px] text-text-secondary">
              The bracket is drawn once fixtures are scheduled.
            </div>
          ) : (
            /* Bracket tree, one column per round */
            <div className="p-6 rounded-[20px] bg-surface border border-border-muted flex flex-col md:flex-row justify-between gap-8 items-center overflow-x-auto shadow-card">
              {detail!.bracket.map((round, index) => (
                <React.Fragment key={round.round}>
                  {index > 0 && <div className="hidden md:block w-8 h-[1px] bg-border-muted" />}
                  <div className="space-y-8 min-w-[150px]">
                    <span className="font-mono text-[8px] text-text-secondary block uppercase tracking-wider">
                      {round.name}
                    </span>
                    {round.matches.map(match => (
                      <BracketMatch
                        key={match.$id}
                        match={match}
                        mySquadIds={featured.my_registered_squad_ids}
                        isFinal={index === detail!.bracket.length - 1}
                      />
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Other tournaments list */}
        <div className="space-y-6">
          <h3 className="font-display text-[18px] text-text-primary uppercase tracking-wider">UPCOMING CUPS</h3>

          <div className="space-y-4">
            {others.length === 0 ? (
              <div className="p-5 rounded-[20px] bg-surface border border-border-muted shadow-card text-center font-mono text-[11px] text-text-secondary">
                No other cups on the calendar.
              </div>
            ) : others.map(cup => (
              <button
                key={cup.$id}
                onClick={() => setFeaturedId(cup.$id)}
                className={`w-full text-left p-5 rounded-[20px] bg-surface border border-border-muted space-y-3.5 shadow-card transition-all hover:border-volt/30 ${
                  cup.status === 'in_progress' || cup.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-elevated border border-border-muted font-mono text-[8px] text-text-secondary uppercase">
                    {cup.status.replace('_', '-')}
                  </span>
                  {cup.slots_left !== null && cup.slots_left > 0 && (
                    <span className="font-mono text-[9px] text-volt font-bold">
                      {cup.slots_left} slot{cup.slots_left === 1 ? '' : 's'} left
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-condensed text-[16px] font-bold text-text-primary uppercase leading-snug">
                    {cup.name}
                  </h4>
                  <p className="font-mono text-[10px] text-text-secondary mt-1">
                    {dateRange(cup.starts_at, cup.ends_at)} · {cup.sport}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border-muted text-[10px] font-mono">
                  <span className="text-text-secondary">
                    {cup.prize_pool ? `Prize: ${cup.prize_pool}` : 'No prize pool'}
                  </span>
                  <span className={`font-condensed font-bold ${
                    cup.is_registered ? 'text-success' : 'text-text-primary'
                  }`}>
                    {cup.is_registered ? 'Entered' : 'View'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Registration Modal Dialog */}
      {showRegModal && (
        <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md p-6 rounded-[24px] bg-surface border border-border-muted space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="font-display text-[22px] text-text-primary uppercase">Register Squad</h3>
              <p className="font-mono text-[11px] text-text-secondary">
                Select an active squad under your captaincy to submit registration.
              </p>
            </div>

            <div className="space-y-3">
              {eligibleSquads.length === 0 ? (
                <div className="p-4 rounded-[16px] bg-elevated border border-border-muted font-mono text-[11px] text-text-secondary text-center">
                  {squads.length === 0
                    ? 'You are not in a squad yet.'
                    : `You captain no ${featured.sport} squad. Only a captain can enter one.`}
                </div>
              ) : eligibleSquads.map((s) => (
                <div
                  key={s.$id}
                  onClick={() => setSelectedSquadId(s.$id)}
                  className={`p-4 rounded-[16px] border cursor-pointer transition-colors ${
                    selectedSquadId === s.$id
                      ? 'bg-volt-dim border-volt'
                      : 'bg-elevated border-border-muted hover:border-volt/30'
                  }`}
                >
                  <h4 className="font-condensed text-[14px] font-bold text-text-primary uppercase">{s.name}</h4>
                  <span className="font-mono text-[9px] text-volt">
                    {s.sport.toUpperCase()} · Avg Pulse {Math.round(s.pulse_avg)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 font-condensed">
              <button
                onClick={handleConfirmRegistration}
                disabled={!selectedSquadId || entering}
                className="flex-1 py-3 rounded-[12px] bg-volt text-volt-text font-bold text-[14px] uppercase hover:scale-102 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {entering ? 'Submitting…' : 'Confirm Registration'}
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

/**
 * One fixture in the bracket. A match with no result yet says so rather than
 * showing a score of zero, which is what a hardcoded bracket could not
 * distinguish.
 */
const BracketMatch: React.FC<{
  match: ApiBracketMatch;
  mySquadIds: string[];
  isFinal: boolean;
}> = ({ match, mySquadIds, isFinal }) => {
  const played = match.status === 'completed';
  const highlight = (squadId: string | null) =>
    squadId && mySquadIds.includes(squadId) ? 'text-volt' : 'text-text-primary';

  if (isFinal && !played) {
    return (
      <div className="p-5 rounded-[16px] bg-volt-dim border border-volt/30 text-center space-y-2 shadow-card">
        <Trophy className="mx-auto text-volt" size={20} fill="currentColor" />
        <span className="font-mono text-[8px] text-volt block font-bold">FINALS</span>
        <div className="font-condensed font-bold text-[14px] text-text-primary uppercase">MATCH PENDING</div>
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-[12px] space-y-1 border ${
      isFinal ? 'bg-volt-dim border-volt/30' : 'bg-elevated border-border-muted'
    }`}>
      <span className="font-mono text-[8px] text-text-secondary block">
        {played ? 'FINAL SCORE' : match.status === 'scheduled' ? 'SCHEDULED' : 'TO BE DECIDED'}
      </span>
      <div className={`font-condensed font-bold text-[12px] ${
        match.winner_id === match.squad_a_id && played
          ? 'text-volt' : highlight(match.squad_a_id)
      }`}>
        {match.squad_a_name ?? 'TBD'}{played && match.squad_a_score !== null && ` (${match.squad_a_score})`}
      </div>
      <div className={`font-condensed font-bold text-[12px] ${
        match.winner_id === match.squad_b_id && played
          ? 'text-volt' : played ? 'text-text-secondary' : highlight(match.squad_b_id)
      }`}>
        {match.squad_b_name ?? 'TBD'}{played && match.squad_b_score !== null && ` (${match.squad_b_score})`}
      </div>
    </div>
  );
};
