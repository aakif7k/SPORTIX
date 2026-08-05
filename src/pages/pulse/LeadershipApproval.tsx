import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMySquads, useLeadership, useSquadMutations } from '@/hooks/useSquads';
import { RoleBadge } from '../../components/pulse/RoleBadge';
import { Sparkles, Check, X, RefreshCw, Users } from 'lucide-react';
import type {
  ApiLeadership, ApiLeadershipStanding, LeadershipComponents, SquadRole,
} from '@/types/api.types';

// Module scope keeps the component identity stable across renders; defined
// inside LeadershipApproval it was a fresh type on every tick of the countdown
// timer, remounting all five bars once a second.
const BreakdownBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between font-mono text-[9px] text-text-secondary">
      <span>{label.toUpperCase()}</span>
      <span className="text-text-primary font-bold">{value}%</span>
    </div>
    <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
      <div className="h-full bg-volt" style={{ width: `${value}%` }} />
    </div>
  </div>
);

/**
 * Time remaining until a real deadline.
 *
 * The countdown used to start at 48 hours on every mount and tick down from
 * there, so it never described anything: reloading the page bought the squad
 * another two days. closes_at comes from the server, derived from when the first
 * vote was cast, so this renders the actual remaining time — and it is computed
 * per render from a fixed target rather than held in state and decremented.
 */
const useCountdown = (closesAt: string | null | undefined) => {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!closesAt) return;
    const target = new Date(closesAt).getTime();
    if (Number.isNaN(target) || target <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [closesAt]);

  if (!closesAt) return null;
  const target = new Date(closesAt).getTime();
  if (Number.isNaN(target)) return null;

  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const LeadershipApproval: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { squads, loading: squadsLoading, error: squadsError, refresh: refreshSquads } = useMySquads();

  // The route carries no squad id, so the squad comes from ?squad= and falls
  // back to the first one the user belongs to.
  const squadId = params.get('squad') ?? squads[0]?.$id;
  const { leadership, loading, error, refresh } = useLeadership(squadId);
  const { voteLeadership, updateRole } = useSquadMutations(squadId);

  const countdown = useCountdown(leadership?.vote?.closes_at);

  if (squadsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8" aria-busy="true" aria-label="Loading squads">
        <div className="h-12 w-2/3 rounded bg-elevated animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 rounded-[24px] bg-surface border border-border-muted/50 animate-shimmer" />
          <div className="h-72 rounded-[24px] bg-surface border border-border-muted/50 animate-shimmer" />
        </div>
      </div>
    );
  }

  if (squadsError) {
    return (
      <ErrorPanel message={squadsError.message} onRetry={() => refreshSquads()} />
    );
  }

  if (squads.length === 0) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-[14px] bg-elevated border border-border-muted flex items-center justify-center text-text-secondary">
          <Users size={20} />
        </div>
        <p className="font-display text-[16px] text-text-primary uppercase tracking-wide">
          No squad to lead yet
        </p>
        <p className="font-mono text-[11px] text-text-secondary">
          Leadership standing is calculated from a squad&apos;s own record. Join or form one first.
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-none uppercase text-text-primary">LEADERSHIP APPROVAL</h1>
          <p className="font-mono text-[11px] text-text-secondary mt-1">
            Leadership standing computed from this squad&apos;s own record.
          </p>
        </div>

        {/* A squad picker, since this route is not scoped to one. */}
        {squads.length > 1 && (
          <select
            value={squadId ?? ''}
            onChange={e => setParams({ squad: e.target.value })}
            aria-label="Choose a squad"
            className="h-9 bg-surface border border-border-muted rounded-[10px] px-3 font-mono text-[11px] text-text-primary focus:outline-none focus:border-volt"
          >
            {squads.map(s => (
              <option key={s.$id} value={s.$id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" aria-busy="true" aria-label="Loading leadership standing">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-72 rounded-[24px] bg-surface border border-border-muted/50 animate-shimmer" />
            <div className="h-44 rounded-[24px] bg-surface border border-border-muted/50 animate-shimmer" />
          </div>
          <div className="h-80 rounded-[24px] bg-surface border border-border-muted/50 animate-shimmer" />
        </div>
      ) : error ? (
        <ErrorPanel message={error.message} onRetry={() => refresh()} />
      ) : !leadership ? (
        <ErrorPanel
          message="This squad's leadership standing is unavailable."
          onRetry={() => refresh()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Side: Current Leadership Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Current Captain Card */}
              <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-5">
                <h3 className="font-display text-[16px] tracking-wider text-text-secondary uppercase">CURRENT SQUAD LEADERSHIP</h3>

                {leadership.captain ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                        <img
                          src={leadership.captain.avatar_url ?? undefined}
                          alt={leadership.captain.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-condensed text-[20px] font-bold text-text-primary uppercase">
                          {leadership.captain.full_name}
                          {leadership.is_captain && ' (You)'}
                        </h4>
                        <div className="flex gap-2 mt-1 items-center">
                          <RoleBadge role="captain" />
                          {leadership.captain_since && (
                            <span className="font-mono text-[9px] text-text-secondary">
                              ESTABLISHED: {new Date(leadership.captain_since)
                                .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border-muted/30">
                      <div className="space-y-1">
                        <span className="font-mono text-[8px] text-text-secondary block">LEADERSHIP SCORE</span>
                        <span className="font-display text-[48px] text-accent block leading-none">
                          {leadership.captain.score} / 100
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(Object.keys(leadership.captain.components) as Array<keyof LeadershipComponents>)
                          .map(key => (
                            <BreakdownBar
                              key={key}
                              label={leadership.component_labels[key] ?? key}
                              value={leadership.captain!.components[key]}
                            />
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-[11px] text-text-secondary">
                    This squad has no captain on record.
                  </p>
                )}
              </div>

              {/* Recommendation Card */}
              {leadership.recommendation && (
                <div className="p-6 rounded-[24px] bg-accent-surface/30 border border-accent/20 border-l-[3px] border-l-accent backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles size={16} />
                    <h3 className="font-display text-[16px] uppercase tracking-wider">PULSE ENGINE RECOMMENDATION</h3>
                  </div>

                  <p className="font-mono text-[11px] text-text-secondary leading-relaxed">
                    Across{' '}
                    <strong className="text-text-primary">
                      {leadership.recommendation.matches_analysed} match
                      {leadership.recommendation.matches_analysed === 1 ? '' : 'es'}
                    </strong>{' '}
                    of validated performance, practice attendance and channel activity, the highest
                    leadership standing outside the captaincy belongs to{' '}
                    <strong className="text-volt">{leadership.recommendation.full_name}</strong>
                    {leadership.recommendation.strengths.length > 0 && (
                      <> — strongest on {leadership.recommendation.strengths.join(' and ').toLowerCase()}</>
                    )}.
                  </p>

                  <div className="p-4 rounded-[16px] bg-elevated border border-border-muted/50 flex flex-wrap gap-3 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={leadership.recommendation.avatar_url ?? undefined}
                        alt={leadership.recommendation.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-condensed text-[15px] font-bold text-text-primary uppercase">
                          {leadership.recommendation.full_name}
                        </h4>
                        <span className="font-mono text-[9px] text-accent">
                          Leadership Score: {leadership.recommendation.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[8px] text-text-secondary block">STRENGTHS</span>
                      <span className="font-mono text-[10px] text-text-primary font-bold block mt-0.5">
                        {leadership.recommendation.strengths.join(' · ') || 'Not enough record yet'}
                      </span>
                    </div>
                  </div>

                  {/* Nominating is casting the first vote for that candidate, which
                      is what opens the 48-hour window on the server. */}
                  {!leadership.vote && (
                    <button
                      onClick={() => voteLeadership({
                        candidate_id: leadership.recommendation!.user_id,
                        vote: 'approve',
                      }).then(() => refresh())}
                      className="w-full py-2.5 rounded-[10px] bg-volt text-volt-text font-condensed font-bold text-[13px] tracking-wider hover:opacity-90 uppercase"
                    >
                      Open a squad vote on {leadership.recommendation.full_name}
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Right Side: Active Approval Votes */}
            <div className="space-y-6">
              <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-5">
                <div className="space-y-1">
                  <h3 className="font-display text-[18px] text-text-primary uppercase tracking-wider">SQUAD VOTE</h3>
                  <p className="font-mono text-[10px] text-text-secondary">
                    {leadership.vote
                      ? `On ${leadership.vote.candidate.full_name} · ${leadership.vote.votes_needed} of ${leadership.vote.total_members} needed`
                      : 'No vote open'}
                  </p>
                </div>

                {!leadership.vote ? (
                  <div className="p-4 rounded-[12px] bg-elevated border border-border-muted text-center font-mono text-[11px] text-text-secondary">
                    Nothing to vote on. A vote opens when a member is put forward.
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-[12px] bg-elevated border border-border-muted text-center font-mono">
                      <span className="text-[9px] text-text-secondary block">
                        {leadership.vote.is_closed ? 'VOTING CLOSED' : 'REMAINING TIME'}
                      </span>
                      <span className="text-[18px] text-text-primary font-bold block mt-0.5 tracking-widest">
                        {leadership.vote.is_closed ? '00:00:00' : countdown ?? '—'}
                      </span>
                    </div>

                    {/* Live Vote Bar */}
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-success">Approve ({leadership.vote.approve} votes)</span>
                        <span className="text-danger">Reject ({leadership.vote.reject} votes)</span>
                      </div>
                      <div className="flex w-full h-2 rounded-full bg-elevated overflow-hidden">
                        <div
                          className="h-full bg-success"
                          style={{ width: `${votePct(leadership.vote.approve, leadership.vote)}%` }}
                        />
                        <div
                          className="h-full bg-danger"
                          style={{ width: `${votePct(leadership.vote.reject, leadership.vote)}%` }}
                        />
                      </div>
                    </div>

                    {/* Member Vote Status */}
                    <div className="space-y-2 border-t border-border-muted pt-4">
                      {leadership.vote.ballots.map(ballot => (
                        <div key={ballot.user_id} className="flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-2">
                            <img
                              src={ballot.avatar_url ?? undefined}
                              alt={ballot.full_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-text-primary">{ballot.full_name}</span>
                          </div>
                          <span className={
                            ballot.vote === 'approve' ? 'text-success font-bold'
                              : ballot.vote === 'reject' ? 'text-danger font-bold'
                                : 'text-text-secondary'
                          }>
                            {ballot.vote === 'approve' ? 'Approved'
                              : ballot.vote === 'reject' ? 'Rejected' : 'Awaiting vote'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Voting Actions */}
                    <div className="space-y-2.5 border-t border-border-muted pt-4">
                      {leadership.vote.my_vote ? (
                        <div className="p-3.5 rounded-[12px] bg-accent-surface border border-accent/20 text-center font-mono text-[11px] text-accent font-bold">
                          Your vote: {leadership.vote.my_vote === 'approve' ? 'Approved' : 'Rejected'}
                        </div>
                      ) : leadership.vote.is_closed ? (
                        <div className="p-3.5 rounded-[12px] bg-elevated border border-border-muted text-center font-mono text-[11px] text-text-secondary">
                          This vote has closed.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => voteLeadership({
                              candidate_id: leadership.vote!.candidate.user_id,
                              vote: 'approve',
                            }).then(() => refresh())}
                            className="w-full py-2.5 rounded-[10px] bg-volt text-volt-text font-condensed font-bold text-[13px] tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5 uppercase"
                          >
                            <Check size={14} /> Approve Recommendation
                          </button>
                          <button
                            onClick={() => voteLeadership({
                              candidate_id: leadership.vote!.candidate.user_id,
                              vote: 'reject',
                            }).then(() => refresh())}
                            className="w-full py-2.5 rounded-[10px] bg-elevated border border-border-muted text-text-primary font-condensed font-bold text-[13px] tracking-wider hover:bg-elevated/80 flex items-center justify-center gap-1.5 uppercase"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Squad Roles section */}
          <div className="space-y-4">
            <h3 className="font-display text-[18px] tracking-[3px] text-text-secondary uppercase">
              TACTICAL ROLE DELEGATIONS
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {leadership.roles.map((slot) => (
                <div key={slot.role} className="p-4 rounded-[16px] bg-surface border border-border-muted/50 shadow-card text-center space-y-3">
                  {slot.member ? (
                    <img
                      src={slot.member.avatar_url ?? undefined}
                      alt={slot.member.full_name}
                      className="w-10 h-10 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mx-auto bg-elevated border border-dashed border-border-muted" />
                  )}
                  <div>
                    <h5 className="font-condensed font-bold text-[13px] text-text-primary leading-none truncate">
                      {slot.member?.full_name ?? 'Unfilled'}
                    </h5>
                    <div className="mt-2.5">
                      <RoleBadge role={slot.role} />
                    </div>
                  </div>
                  {leadership.is_captain && (
                    <RoleAssigner
                      role={slot.role}
                      current={slot.member}
                      standings={leadership.standings}
                      onAssign={userId => updateRole({ targetUserId: userId, role: slot.role })
                        .then(() => refresh())}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Percentages of the squad, not of the votes cast: two approvals in a squad of
 * ten is not an 80% bar, and the earlier markup hardcoded exactly that.
 */
const votePct = (count: number, vote: { total_members: number }) =>
  vote.total_members > 0 ? Math.round((count / vote.total_members) * 100) : 0;

const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="p-8 rounded-[20px] bg-surface border border-border-muted shadow-card text-center space-y-3 max-w-md mx-auto">
    <p className="font-display text-[15px] text-text-primary uppercase tracking-wide">
      Leadership standing did not load
    </p>
    <p className="font-mono text-[11px] text-text-secondary">{message}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-volt text-volt-text font-mono text-[10px] font-bold uppercase"
    >
      <RefreshCw size={12} /> Retry
    </button>
  </div>
);

/**
 * The Assign button used to do nothing. Roles are a real column and there is a
 * PATCH for them, so this picks who holds the role.
 */
const RoleAssigner: React.FC<{
  role: SquadRole;
  current: ApiLeadershipStanding | null;
  standings: ApiLeadership['standings'];
  onAssign: (userId: string) => void;
}> = ({ role, current, standings, onAssign }) => (
  <select
    value={current?.user_id ?? ''}
    onChange={e => e.target.value && onAssign(e.target.value)}
    aria-label={`Assign ${role}`}
    className="w-full py-1 rounded-[8px] bg-elevated border border-border-muted hover:bg-elevated/80 font-mono text-[9px] text-text-secondary hover:text-text-primary uppercase transition-colors focus:outline-none focus:border-volt"
  >
    <option value="">Assign</option>
    {standings.map(member => (
      <option key={member.user_id} value={member.user_id}>
        {member.full_name} · {member.score}
      </option>
    ))}
  </select>
);
