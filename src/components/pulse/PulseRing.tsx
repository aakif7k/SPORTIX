import React, { useEffect, useState } from 'react';

interface PulseRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const PulseRing: React.FC<PulseRingProps> = ({
  score,
  size = 'md',
  animated = true,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (animated) {
      const start = 0;
      const end = score;
      const duration = 1200; // ms
      const startTime = performance.now();

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const ease = progress * (2 - progress);
        setAnimatedScore(Math.round(start + ease * (end - start)));

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    } else {
      setAnimatedScore(score);
    }
  }, [score, animated]);

  // Dimensions based on size
  const dims = {
    sm: { r: 24, w: 60, h: 60, stroke: 4, textClass: 'text-[12px]' },
    md: { r: 40, w: 100, h: 100, stroke: 5, textClass: 'text-[20px]' },
    lg: { r: 68, w: 160, h: 160, stroke: 6, textClass: 'text-[36px]' },
  }[size];

  const circumference = 2 * Math.PI * dims.r;
  const strokeDashoffset = circumference - (animatedScore / 1000) * circumference;

  const getTier = (s: number) => {
    if (s >= 900) return 'PULSE ELITE';
    if (s >= 800) return 'ELITE';
    return 'CONTENDER';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: dims.w, height: dims.h }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Track */}
          <circle
            cx={dims.w / 2}
            cy={dims.h / 2}
            r={dims.r}
            className="stroke-[#1A2200]"
            strokeWidth={dims.stroke}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={dims.w / 2}
            cy={dims.h / 2}
            r={dims.r}
            className="stroke-[#CCFF00] transition-all duration-1000 ease-out"
            strokeWidth={dims.stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-[#CCFF00] leading-none ${dims.textClass}`}>
            {animatedScore}
          </span>
          {size === 'lg' && (
            <span className="font-mono text-[9px] text-text-secondary mt-1 tracking-wider">
              SCORE
            </span>
          )}
        </div>
      </div>

      {size === 'lg' && (
        <div className="mt-3 px-3 py-1 rounded-full bg-[#1A2200] border border-[#CCFF00]/30">
          <span className="font-mono text-[10px] font-bold text-[#CCFF00] tracking-wider">
            {getTier(score)}
          </span>
        </div>
      )}
    </div>
  );
};
