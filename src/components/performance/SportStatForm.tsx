import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatInputStepper } from './StatInputStepper';
import { useMatchReportStore } from '../../store/matchReportStore';
import type { PerformanceSport } from '../../types/performance.types';

interface SportStatFormProps {
  sport: PerformanceSport;
}

// Football positions
const FOOTBALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];
// Cricket roles
const CRICKET_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
// Basketball positions
const BASKETBALL_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export const SportStatForm: React.FC<SportStatFormProps> = ({ sport }) => {
  const { sportStats, position, setStat, setPosition } = useMatchReportStore();

  const getStat = (key: string, def = 0): number => Number(sportStats[key] ?? def);
  const isGK = position === 'GK';

  // ── Football ──────────────────────────────────────────────────────────────

  if (sport === 'football') {
    return (
      <div className="space-y-5">
        {/* Position selector */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)] mb-3">
            YOUR POSITION
          </p>
          <div className="flex flex-wrap gap-2">
            {FOOTBALL_POSITIONS.map((pos) => (
              <motion.button
                key={pos}
                whileTap={{ scale: 0.93 }}
                onClick={() => setPosition(pos)}
                className="px-3 py-1.5 rounded-full font-mono text-[12px] font-bold transition-all"
                style={
                  position === pos
                    ? { background: 'var(--accent)', color: '#080808', border: '1px solid var(--accent)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {pos}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <StatInputStepper label="Goals Scored"      emoji="⚽" value={getStat('goals')}   onChange={(v) => setStat('goals', v)}   min={0} max={20} />
          <StatInputStepper label="Assists Provided"  emoji="🎯" value={getStat('assists')} onChange={(v) => setStat('assists', v)} min={0} max={15} />
          <StatInputStepper label="Successful Passes" emoji="↗" value={getStat('passes')}  onChange={(v) => setStat('passes', v)}  min={0} max={100} />
          <StatInputStepper label="Tackles Won"       emoji="🛡" value={getStat('tackles')} onChange={(v) => setStat('tackles', v)} min={0} max={30} />
          <AnimatePresence>
            {isGK && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <StatInputStepper label="Saves (GK)" emoji="🧤" value={getStat('saves')} onChange={(v) => setStat('saves', v)} min={0} max={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Cricket ───────────────────────────────────────────────────────────────

  if (sport === 'cricket') {
    const runs = getStat('runs');
    const balls = getStat('ballsFaced');
    const sr = balls > 0 ? Math.round((runs / balls) * 100) : 0;

    return (
      <div className="space-y-5">
        {/* Role selector */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)] mb-3">
            YOUR ROLE
          </p>
          <div className="flex flex-wrap gap-2">
            {CRICKET_ROLES.map((role) => (
              <motion.button
                key={role}
                whileTap={{ scale: 0.93 }}
                onClick={() => setPosition(role)}
                className="px-4 py-2 rounded-full font-mono text-[12px] font-bold transition-all"
                style={
                  position === role
                    ? { background: 'var(--accent)', color: '#080808', border: '1px solid var(--accent)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {role}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <StatInputStepper label="Runs Scored"    emoji="🏏" value={runs}           onChange={(v) => setStat('runs', v)}        min={0} max={300} />
          <StatInputStepper label="Wickets Taken"  emoji="🎳" value={getStat('wickets')}   onChange={(v) => setStat('wickets', v)}     min={0} max={10} />
          <StatInputStepper label="Catches Taken"  emoji="🤲" value={getStat('catches')}   onChange={(v) => setStat('catches', v)}     min={0} max={10} />
          <StatInputStepper label="Balls Faced"    emoji="🏃" value={balls}          onChange={(v) => setStat('ballsFaced', v)}  min={0} max={300} />
        </div>

        {sr > 0 && (
          <div className="p-3 rounded-[12px] font-mono text-[13px] text-[var(--text-secondary)]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            📊 Strike Rate: <strong style={{ color: 'var(--accent)' }}>{sr}</strong> (auto-calculated)
          </div>
        )}
      </div>
    );
  }

  // ── Basketball ────────────────────────────────────────────────────────────

  if (sport === 'basketball') {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)] mb-3">
            YOUR POSITION
          </p>
          <div className="flex flex-wrap gap-2">
            {BASKETBALL_POSITIONS.map((pos) => (
              <motion.button
                key={pos}
                whileTap={{ scale: 0.93 }}
                onClick={() => setPosition(pos)}
                className="px-3 py-1.5 rounded-full font-mono text-[12px] font-bold transition-all"
                style={
                  position === pos
                    ? { background: 'var(--accent)', color: '#080808', border: '1px solid var(--accent)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {pos}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <StatInputStepper label="Points Scored" emoji="🏀" value={getStat('points')}   onChange={(v) => setStat('points', v)}   min={0} max={60} />
          <StatInputStepper label="Assists"        emoji="🎯" value={getStat('assists')}  onChange={(v) => setStat('assists', v)}  min={0} max={20} />
          <StatInputStepper label="Rebounds"       emoji="💪" value={getStat('rebounds')} onChange={(v) => setStat('rebounds', v)} min={0} max={25} />
          <StatInputStepper label="Steals"         emoji="🔒" value={getStat('steals')}   onChange={(v) => setStat('steals', v)}   min={0} max={15} />
          <StatInputStepper label="Blocks"         emoji="🛡" value={getStat('blocks')}   onChange={(v) => setStat('blocks', v)}   min={0} max={10} />
        </div>
      </div>
    );
  }

  // ── Running ───────────────────────────────────────────────────────────────

  if (sport === 'running') {
    const mins = Math.floor(getStat('finishTimeSeconds') / 60);
    const secs = getStat('finishTimeSeconds') % 60;

    return (
      <div className="space-y-4">
        {/* Time input */}
        <div>
          <label className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)] block mb-2">
            FINISH TIME (MM:SS)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number" min={0} max={99} value={mins}
              onChange={(e) => setStat('finishTimeSeconds', Number(e.target.value) * 60 + secs)}
              className="w-20 text-center font-display text-[28px] rounded-[10px] outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            />
            <span className="font-display text-[28px] text-[var(--text-muted)]">:</span>
            <input
              type="number" min={0} max={59} value={secs}
              onChange={(e) => setStat('finishTimeSeconds', mins * 60 + Number(e.target.value))}
              className="w-20 text-center font-display text-[28px] rounded-[10px] outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--accent)' }}
            />
          </div>
        </div>

        <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <StatInputStepper label="Distance (km)"  emoji="📍" value={getStat('distanceKm', 5)}      onChange={(v) => setStat('distanceKm', v)}       min={1} max={100} />
          <StatInputStepper label="Finish Position" emoji="🏅" value={getStat('positionFinished', 1)} onChange={(v) => setStat('positionFinished', v)}  min={1} max={500} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-[14px]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div>
            <p className="font-condensed font-semibold text-[15px] text-[var(--text-primary)]">Personal Best?</p>
            <p className="font-mono text-[11px] text-[var(--text-muted)]">Earn +50 Pulse bonus</p>
          </div>
          <button
            onClick={() => setStat('personalBest', !sportStats.personalBest)}
            className="px-4 py-2 rounded-[10px] font-mono text-[12px] font-bold transition-all"
            style={
              sportStats.personalBest
                ? { background: 'var(--accent)', color: '#080808' }
                : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {sportStats.personalBest ? '✓ YES' : 'NO'}
          </button>
        </div>
      </div>
    );
  }

  // ── Generic ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <StatInputStepper label="Match Contribution" emoji="⭐" value={getStat('contribution', 5)} onChange={(v) => setStat('contribution', v)} min={0} max={10} />
      </div>

      {/* Team Impact selector */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-[var(--text-muted)] mb-2">TEAM IMPACT</p>
        <div className="flex gap-2 flex-wrap">
          {(['Low', 'Medium', 'High', 'Outstanding'] as const).map((lvl) => (
            <motion.button
              key={lvl}
              whileTap={{ scale: 0.93 }}
              onClick={() => setStat('teamImpact', lvl.toLowerCase())}
              className="px-4 py-2 rounded-full font-mono text-[12px] font-bold transition-all"
              style={
                sportStats.teamImpact === lvl.toLowerCase()
                  ? { background: 'var(--accent)', color: '#080808', border: '1px solid var(--accent)' }
                  : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {lvl}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
