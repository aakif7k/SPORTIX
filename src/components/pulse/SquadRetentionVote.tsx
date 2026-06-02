import React, { useState } from 'react';

interface SquadRetentionVoteProps {
  onVote: (vote: 'definitely' | 'maybe' | 'no') => void;
}

export const SquadRetentionVote: React.FC<SquadRetentionVoteProps> = ({ onVote }) => {
  const [selected, setSelected] = useState<'definitely' | 'maybe' | 'no' | null>(null);

  const handleSelect = (option: 'definitely' | 'maybe' | 'no') => {
    setSelected(option);
  };

  const handleComplete = () => {
    if (selected) {
      onVote(selected);
    }
  };

  return (
    <div className="space-y-8">
      {/* 3 Large Vote Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Definitely */}
        <div
          onClick={() => handleSelect('definitely')}
          style={{
            borderColor: selected === 'definitely' ? 'var(--accent)' : 'var(--border)',
            backgroundColor: selected === 'definitely' ? 'var(--accent-surface)' : 'var(--bg-elevated)'
          }}
          className="rounded-[20px] p-6 border text-center cursor-pointer transition-all duration-200 hover:border-volt/30 shadow-card hover:shadow-hover"
        >
          {/* Thumbs Up SVG */}
          <svg className="mx-auto w-10 h-10 mb-4 text-volt" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10h4.757c1.246 0 2.217 1.156 1.83 2.39L18 20H8v-8l4-4V4.757C12 3.786 12.786 3 13.757 3h.486c.97 0 1.757.786 1.757 1.757v4.486L14 10zM4 21v-9h4v9H4z" />
          </svg>
          <h4 className="font-condensed text-[20px] font-bold text-text-primary mb-1.5">Definitely</h4>
          <p className="font-mono text-[10px] text-text-secondary">Great chemistry — keep it together</p>
        </div>

        {/* Maybe */}
        <div
          onClick={() => handleSelect('maybe')}
          style={{
            borderColor: selected === 'maybe' ? 'var(--warning)' : 'var(--border)',
            backgroundColor: selected === 'maybe' ? 'var(--warning-dim)' : 'var(--bg-elevated)'
          }}
          className="rounded-[20px] p-6 border text-center cursor-pointer transition-all duration-200 hover:border-warning/30 shadow-card hover:shadow-hover"
        >
          {/* Flat hand/shake SVG */}
          <svg className="mx-auto w-10 h-10 mb-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12h18M3 8h18M3 16h18" />
          </svg>
          <h4 className="font-condensed text-[20px] font-bold text-text-primary mb-1.5">Maybe</h4>
          <p className="font-mono text-[10px] text-text-secondary">Decent squad, open to changes</p>
        </div>

        {/* No */}
        <div
          onClick={() => handleSelect('no')}
          style={{
            borderColor: selected === 'no' ? 'var(--danger)' : 'var(--border)',
            backgroundColor: selected === 'no' ? 'var(--danger-dim)' : 'var(--bg-elevated)'
          }}
          className="rounded-[20px] p-6 border text-center cursor-pointer transition-all duration-200 hover:border-danger/30 shadow-card hover:shadow-hover"
        >
          {/* Thumbs Down SVG */}
          <svg className="mx-auto w-10 h-10 mb-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14H5.243c-1.246 0-2.217-1.156-1.83-2.39L6 4h10v8l-4 4v3.243C12 20.214 11.214 21 10.243 21h-.486c-.97 0-1.757-.786-1.757-1.757v-4.486L10 14zM20 3v9h-4V3h4z" />
          </svg>
          <h4 className="font-condensed text-[20px] font-bold text-text-primary mb-1.5">No</h4>
          <p className="font-mono text-[10px] text-text-secondary">Pulse Engine will restructure</p>
        </div>

      </div>

      {/* Retention Split */}
      <div className="rounded-[16px] p-5 bg-surface border border-border-muted/50 space-y-4 shadow-card">
        <div className="flex justify-between items-center font-mono text-[11px]">
          <span className="text-text-secondary">VOTE STATISTICS</span>
          <span className="text-text-primary font-bold">9 / 15 players voted "Definitely"</span>
        </div>
        
        {/* Segmented bar */}
        <div className="flex w-full h-1.5 bg-border-muted/30 rounded-full overflow-hidden gap-[2px]">
          <div className="h-full bg-volt" style={{ width: '60%' }} />
          <div className="h-full bg-warning" style={{ width: '25%' }} />
          <div className="h-full bg-danger" style={{ width: '15%' }} />
        </div>

        <p className="font-mono text-[10px] text-text-secondary leading-relaxed">
          <strong className="text-volt">AI Recommendation:</strong> Retain Core Squad · Replace 4 members (due to low activity signals or reliability score drop).
        </p>
      </div>

      <button
        onClick={handleComplete}
        disabled={!selected}
        className="w-full py-3.5 rounded-[12px] bg-volt text-volt-text font-condensed font-bold tracking-wider hover:scale-102 transition-transform disabled:opacity-50 uppercase shadow-card"
      >
        Complete Post-Match Review →
      </button>
    </div>
  );
};
