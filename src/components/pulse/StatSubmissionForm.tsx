import React, { useState } from 'react';
import { Plus, Minus, Upload, Award } from 'lucide-react';

interface StatSubmissionFormProps {
  sport: string;
  onSubmit: (stats: Record<string, number | string | boolean>) => void;
}

// Defined at module scope so its identity is stable across renders. When this
// lived inside StatSubmissionForm, every render produced a new component type
// and React remounted each stepper, discarding focus.
const Stepper: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({
  label,
  value,
  onChange
}) => (
  <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-base border border-border-muted">
    <span className="font-mono text-[11px] text-text-secondary uppercase">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/5 flex items-center justify-center text-[#CCFF00] hover:bg-white/10"
      >
        <Minus size={14} />
      </button>
      <span className="font-mono text-[14px] font-bold text-white w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/5 flex items-center justify-center text-[#CCFF00] hover:bg-white/10"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

export const StatSubmissionForm: React.FC<StatSubmissionFormProps> = ({
  sport,
  onSubmit,
}) => {
  const [rating, setRating] = useState(7);
  const [mvp, setMvp] = useState(false);

  // Football states
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [tackles, setTackles] = useState(0);
  const [position, setPosition] = useState('CM');

  // Cricket states
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [catches, setCatches] = useState(0);
  const [impact, setImpact] = useState('Medium');

  // Basketball states
  const [points, setPoints] = useState(0);
  const [rebounds, setRebounds] = useState(0);
  const [bAssists, setBAssists] = useState(0);
  const [plusMinus, setPlusMinus] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, number | string | boolean> = { rating, mvp };

    if (sport === 'Football') {
      data.goals = goals;
      data.assists = assists;
      data.tackles = tackles;
      data.position = position;
    } else if (sport === 'Cricket') {
      data.runs = runs;
      data.wickets = wickets;
      data.catches = catches;
      data.impact = impact;
    } else if (sport === 'Basketball') {
      data.points = points;
      data.rebounds = rebounds;
      data.assists = bAssists;
      data.plusMinus = plusMinus;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dynamic Fields */}
      <div className="space-y-3">
        {sport === 'Football' && (
          <>
            <Stepper label="Goals Scored" value={goals} onChange={setGoals} />
            <Stepper label="Assists" value={assists} onChange={setAssists} />
            <Stepper label="Tackles Made" value={tackles} onChange={setTackles} />
            <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-base border border-border-muted">
              <span className="font-mono text-[11px] text-text-secondary uppercase">Position Played</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-[8px] px-3 py-1.5 font-mono text-[11px] text-[#CCFF00] focus:outline-none focus:border-[#CCFF00]"
              >
                {['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST'].map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {sport === 'Cricket' && (
          <>
            <Stepper label="Runs Scored" value={runs} onChange={setRuns} />
            <Stepper label="Wickets Taken" value={wickets} onChange={setWickets} />
            <Stepper label="Catches" value={catches} onChange={setCatches} />
            <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-base border border-border-muted">
              <span className="font-mono text-[11px] text-text-secondary uppercase">Match Impact</span>
              <div className="flex gap-1.5">
                {['Low', 'Medium', 'High', 'Match-winning'].map((imp) => (
                  <button
                    key={imp}
                    type="button"
                    onClick={() => setImpact(imp)}
                    className={`px-3 py-1.5 rounded-[8px] font-mono text-[10px] border transition-all ${
                      impact === imp
                        ? 'bg-[#CCFF00]/15 border-[#CCFF00] text-[#CCFF00]'
                        : 'bg-white/5 border-transparent text-text-secondary'
                    }`}
                  >
                    {imp}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {sport === 'Basketball' && (
          <>
            <Stepper label="Points" value={points} onChange={setPoints} />
            <Stepper label="Rebounds" value={rebounds} onChange={setRebounds} />
            <Stepper label="Assists" value={bAssists} onChange={setBAssists} />
            
            <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-base border border-border-muted">
              <span className="font-mono text-[11px] text-text-secondary uppercase">Plus / Minus</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlusMinus(plusMinus - 1)}
                  className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/5 flex items-center justify-center text-[#CCFF00] hover:bg-white/10"
                >
                  <Minus size={14} />
                </button>
                <span className="font-mono text-[14px] font-bold text-white w-8 text-center">
                  {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
                </span>
                <button
                  type="button"
                  onClick={() => setPlusMinus(plusMinus + 1)}
                  className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/5 flex items-center justify-center text-[#CCFF00] hover:bg-white/10"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Common Fields: Rating Slider */}
      <div className="p-5 rounded-[16px] bg-[rgba(255,255,255,0.02)] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[11px] text-text-secondary uppercase">Match Rating</span>
          <span className="font-display text-[22px] text-[#CCFF00]">{rating} / 10</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="w-full h-1 bg-[#1A2200] rounded-lg appearance-none cursor-pointer accent-[#CCFF00]"
          />
        </div>
      </div>

      {/* Common Fields: MVP Switch */}
      <div className="flex items-center justify-between p-4 rounded-[12px] bg-base border border-border-muted">
        <div className="flex items-center gap-2.5">
          <Award className="text-[#CCFF00]" size={18} />
          <div>
            <p className="font-condensed text-[14px] font-bold text-white">MVP Status</p>
            <p className="font-mono text-[10px] text-text-secondary mt-0.5">I received MVP this match</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMvp(!mvp)}
          className={`relative w-12 h-6 rounded-full transition-colors ${mvp ? 'bg-[#CCFF00]' : 'bg-white/10'}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
              mvp ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Common Fields: Media Proof */}
      <div className="border border-dashed border-white/10 hover:border-[#CCFF00]/30 transition-colors rounded-[16px] p-6 text-center space-y-2 cursor-pointer bg-white/1">
        <Upload className="mx-auto text-text-secondary" size={24} />
        <p className="font-condensed text-[13px] font-bold text-white">Upload Media Proof (Optional)</p>
        <p className="font-mono text-[9px] text-text-secondary">Drag and drop match sheets, logs or clips</p>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-[12px] bg-[#CCFF00] text-black font-condensed font-bold tracking-wider hover:scale-102 transition-transform uppercase"
      >
        Submit Performance →
      </button>
    </form>
  );
};
