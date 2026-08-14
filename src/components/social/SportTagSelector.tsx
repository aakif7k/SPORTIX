/**
 * SportTagSelector.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modern, accessible, rock-solid sport selector for SPORTiX social posts.
 * Lists all 30 sports from `sportix_sport_roles` without showing technical sport IDs.
 * Built with zero jitter/flicker and instant click selection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Tag } from 'lucide-react';
import { OFFICIAL_SPORTIX_SPORTS_ROLES } from '@/services/sportsRoleService';

interface SportTagSelectorProps {
  value: string;
  onChange: (sport: string) => void;
  label?: string;
  className?: string;
}

const SPORT_EMOJIS: Record<string, string> = {
  Football: '⚽',
  Cricket: '🏏',
  Basketball: '🏀',
  Volleyball: '🏐',
  Tennis: '🎾',
  Badminton: '🏸',
  'Field Hockey': '🏑',
  Baseball: '⚾',
  Softball: '🥎',
  Rugby: '🏉',
  'American Football': '🏈',
  'Water Polo': '🤽',
  'Table Tennis': '🏓',
  Boxing: '🥊',
  MMA: '🥋',
  Swimming: '🏊',
  Cycling: '🚴',
  Athletics: '🏃',
  Golf: '⛳',
  Lacrosse: '🥍',
  'Beach Volleyball': '🏖️',
  Pickleball: '🏓',
  Darts: '🎯',
  Gymnastics: '🤸',
  Handball: '🤾',
  Kabaddi: '🤼',
  'Kho-Kho': '🏃',
  Wrestling: '🤼',
  Futsal: '⚽',
  Squash: '🎾',
  'Multi-Sport': '🏆',
};

const ALL_SPORTS_LIST = [
  'Multi-Sport',
  ...OFFICIAL_SPORTIX_SPORTS_ROLES.map(s => s.sport)
];

const POPULAR_SPORTS = ['Football', 'Cricket', 'Basketball', 'Badminton', 'Tennis', 'MMA', 'Multi-Sport'];

export const SportTagSelector: React.FC<SportTagSelectorProps> = ({
  value,
  onChange,
  label = 'SPORT TAG:',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSport = value || 'Football';
  const selectedEmoji = SPORT_EMOJIS[selectedSport] || '🏆';

  // Handle outside click safely without blocking option clicks
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const filteredSports = ALL_SPORTS_LIST.filter(sport =>
    sport.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelectSport = (sport: string) => {
    onChange(sport);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {/* Selector Row */}
      <div className="flex items-center gap-2">
        {label && (
          <span className="font-mono text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1 flex-shrink-0">
            <Tag size={12} className="text-accent" />
            <span>{label}</span>
          </span>
        )}

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex-1 flex items-center justify-between gap-2 bg-elevated hover:bg-surface border border-border-muted hover:border-accent/50 focus:border-accent rounded-xl px-3.5 py-2 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm flex-shrink-0">{selectedEmoji}</span>
            <span className="font-mono text-xs font-bold text-text-primary truncate">
              {selectedSport}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-150 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </button>
      </div>

      {/* Quick Select Popular Pills (Always click-accessible in 1 tap) */}
      {!isOpen && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {POPULAR_SPORTS.map(sp => {
            const isCur = selectedSport.toLowerCase() === sp.toLowerCase();
            return (
              <button
                key={sp}
                type="button"
                onClick={() => onChange(sp)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                  isCur
                    ? 'bg-accent/15 border-accent text-accent font-bold'
                    : 'bg-elevated/70 border-border-muted/70 text-text-secondary hover:text-text-primary hover:border-accent/40'
                }`}
              >
                <span>{SPORT_EMOJIS[sp] || '🏆'}</span>
                <span>{sp}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown Menu (Fixed in flow with stable positioning) */}
      {isOpen && (
        <div className="bg-surface border border-border-muted rounded-2xl p-3 shadow-xl space-y-2.5 animate-in fade-in duration-100">
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 30+ sports..."
              autoFocus
              className="w-full bg-elevated border border-border-muted rounded-xl pl-8 pr-3 py-1.5 font-mono text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent"
            />
          </div>

          {/* Sports Grid List */}
          <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5 custom-scrollbar" role="listbox">
            {filteredSports.length === 0 ? (
              <div className="col-span-2 py-4 text-center font-mono text-xs text-text-muted">
                No matching sport found.
              </div>
            ) : (
              filteredSports.map(sp => {
                const isSelected = selectedSport.toLowerCase() === sp.toLowerCase();
                const emoji = SPORT_EMOJIS[sp] || '🏆';

                return (
                  <button
                    key={sp}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleSelectSport(sp);
                    }}
                    onClick={() => handleSelectSport(sp)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left font-mono text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-accent/15 border border-accent/40 text-accent font-bold'
                        : 'bg-elevated/50 hover:bg-elevated text-text-secondary hover:text-text-primary border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm flex-shrink-0">{emoji}</span>
                      <span className="truncate">{sp}</span>
                    </div>

                    {isSelected && (
                      <Check size={12} strokeWidth={3} className="text-accent flex-shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
