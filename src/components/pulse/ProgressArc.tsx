import React from 'react';

interface ProgressArcProps {
  value: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export const ProgressArc: React.FC<ProgressArcProps> = ({
  value,
  size = 80,
  strokeWidth = 3,
  color = '#CCFF00',
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-white/5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-white" style={{ fontSize: `${size * 0.22}px` }}>
            {value}%
          </span>
          {label && (
            <span className="font-mono text-[7px] text-text-secondary uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
