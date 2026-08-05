import React from 'react';
import { SPORT_CATEGORIES } from '@/constants/sports';
import type { SportCategory } from '../../types';

interface AvatarProps {
  src?: string;
  name: string;
  sport?: SportCategory;
  isOnline?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

const dotSizeMap = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border',
  lg: 'w-3 h-3 border-2',
  xl: 'w-3.5 h-3.5 border-2',
  '2xl': 'w-4 h-4 border-2',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, sport, isOnline, size = 'md', className = '' }) => {
  const sportData = sport ? SPORT_CATEGORIES.find(s => s.id === sport) : null;
  const ringColor = sportData?.color || '#2A2A2A';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full overflow-hidden flex items-center justify-center font-label font-semibold`}
        style={{ border: `2px solid ${ringColor}40`, background: src ? 'transparent' : `${ringColor}20`, color: ringColor }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dotSizeMap[size]} rounded-full border-base ${isOnline ? 'bg-volt' : 'bg-text-muted'}`} />
      )}
    </div>
  );
};
