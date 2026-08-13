import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Grid
} from 'lucide-react';

interface FuturisticCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minAge?: number;
  className?: string;
}

const MONTHS_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const DECADES = [
  { label: '1980s', start: 1980 },
  { label: '1990s', start: 1990 },
  { label: '2000s', start: 2000 },
  { label: '2010s', start: 2010 },
];

export const FuturisticCalendar: React.FC<FuturisticCalendarProps> = ({
  value,
  onChange,
  minAge = 13,
  className = '',
}) => {
  // Parse initial date or default to 18 years ago for convenience
  const initialDate = useMemo(() => {
    if (value && !isNaN(new Date(value).getTime())) {
      const d = new Date(value);
      return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        day: d.getUTCDate(),
      };
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
    };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);
  const [viewMode, setViewMode] = useState<'calendar' | 'years' | 'quick'>('calendar');
  const [yearPageStart, setYearPageStart] = useState<number>(
    Math.floor(initialDate.year / 12) * 12
  );

  // Synchronize view when external value changes
  useEffect(() => {
    if (value && !isNaN(new Date(value).getTime())) {
      const d = new Date(value);
      setViewYear(d.getUTCFullYear());
      setViewMonth(d.getUTCMonth());
    }
  }, [value]);

  // Selected date components
  const selected = useMemo(() => {
    if (!value || isNaN(new Date(value).getTime())) return null;
    const d = new Date(value);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
    };
  }, [value]);

  // Calculated Age & Athletic Tier
  const athleteStatus = useMemo(() => {
    if (!value) return null;
    const dob = new Date(value);
    if (isNaN(dob.getTime())) return null;
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    
    let tier = 'PRODIGY';
    let tierDesc = 'Next-Gen Athlete';
    let color = '#CCFF00';

    if (age < 16) {
      tier = 'NEXT-GEN PRODIGY';
      tierDesc = 'Academy Development';
      color = '#38BDF8';
    } else if (age <= 19) {
      tier = 'RISING TALENT';
      tierDesc = 'Prime Scout Window';
      color = '#CCFF00';
    } else if (age <= 27) {
      tier = 'PEAK PERFORMANCE';
      tierDesc = 'Elite Prime Tier';
      color = '#A855F7';
    } else if (age <= 34) {
      tier = 'PRO VETERAN';
      tierDesc = 'Mastery & Leadership';
      color = '#F59E0B';
    } else {
      tier = 'LEGEND CLASS';
      tierDesc = 'Master Division';
      color = '#EC4899';
    }

    const isValid = age >= minAge && age <= 100;

    return { age, tier, tierDesc, color, isValid };
  }, [value, minAge]);

  // Days in current view month
  const daysInMonth = useMemo(() => {
    return new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  }, [viewYear, viewMonth]);

  // First day of current view month (0=Sunday, 1=Monday, ... convert to 0=Monday)
  const startDayOffset = useMemo(() => {
    const day = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    return day === 0 ? 6 : day - 1; // ISO week (Mon=0, Sun=6)
  }, [viewYear, viewMonth]);

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);

  // 12-year grid for Year selection view
  const yearsGrid = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => yearPageStart + i);
  }, [yearPageStart]);

  // Quick jump to 18 / 21 / 25 years ago
  const setQuickAge = (targetAge: number) => {
    const target = new Date();
    target.setFullYear(target.getFullYear() - targetAge);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    setViewYear(y);
    setViewMonth(target.getMonth());
    onChange(`${y}-${m}-${d}`);
  };

  return (
    <div className={`relative w-full rounded-3xl bg-[#0B0B0C] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)] p-4 sm:p-6 overflow-hidden select-none font-sans ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#CCFF00]/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#38BDF8]/5 blur-3xl pointer-events-none rounded-full" />

      {/* ── TOP HUD DISPLAY ────────────────────────────────────────── */}
      <div className="relative z-10 mb-5 p-4 rounded-2xl bg-[#141416]/90 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
              <CalendarIcon size={14} />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#CCFF00] font-bold">
              PLAYER DNA // CHRONO-MATRIX
            </span>
          </div>

          {athleteStatus && (
            <span
              className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                athleteStatus.isValid
                  ? 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {athleteStatus.isValid ? (
                <>
                  <CheckCircle2 size={11} /> ELIGIBLE (13+)
                </>
              ) : (
                <>
                  <AlertTriangle size={11} /> MIN 13 YRS
                </>
              )}
            </span>
          )}
        </div>

        {/* Big Holographic Date Readout */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 border-t border-white/5">
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              SELECTED DATE OF BIRTH
            </div>
            <div className="font-display text-2xl sm:text-3xl font-black text-white tracking-wide mt-0.5">
              {selected ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-[#CCFF00]">{String(selected.day).padStart(2, '0')}</span>
                  <span>{MONTHS_FULL[selected.month]}</span>
                  <span className="text-white/70 font-mono text-xl sm:text-2xl">{selected.year}</span>
                </span>
              ) : (
                <span className="text-text-muted font-mono text-xl">SELECT YOUR BIRTH DATE</span>
              )}
            </div>
          </div>

          {/* Age & Status Pill */}
          {athleteStatus && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-elevated border border-white/10 text-right">
                <div className="font-mono text-xs font-black text-[#CCFF00]">
                  AGE: {athleteStatus.age} YRS
                </div>
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                  {athleteStatus.tier}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK DECADE & PRESET SELECTOR ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        {/* Decades pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DECADES.map(dec => {
            const isDecadeActive = viewYear >= dec.start && viewYear < dec.start + 10;
            return (
              <button
                key={dec.label}
                type="button"
                onClick={() => {
                  setViewYear(dec.start + 4);
                  setYearPageStart(dec.start);
                  setViewMode('calendar');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all ${
                  isDecadeActive
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                    : 'bg-[#181818] text-text-muted hover:text-white border border-white/5'
                }`}
              >
                {dec.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
              viewMode === 'calendar' ? 'bg-[#CCFF00] text-black' : 'text-text-muted hover:text-white'
            }`}
          >
            <Grid size={11} /> Grid
          </button>
          <button
            type="button"
            onClick={() => {
              setYearPageStart(Math.floor(viewYear / 12) * 12);
              setViewMode('years');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
              viewMode === 'years' ? 'bg-[#CCFF00] text-black' : 'text-text-muted hover:text-white'
            }`}
          >
            <Sparkles size={11} /> Years
          </button>
        </div>
      </div>

      {/* ── YEAR & MONTH NAV CONTROLLER ────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#141416] border border-white/10 mb-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevYear}
            title="Previous Year (-1)"
            className="w-8 h-8 rounded-xl bg-surface border border-white/5 hover:border-[#CCFF00]/40 flex items-center justify-center text-text-muted hover:text-[#CCFF00] transition-all"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Previous Month"
            className="w-8 h-8 rounded-xl bg-surface border border-white/5 hover:border-[#CCFF00]/40 flex items-center justify-center text-text-muted hover:text-[#CCFF00] transition-all"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Current Month & Year Display */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(m => m === 'years' ? 'calendar' : 'years')}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated border border-white/10 hover:border-[#CCFF00]/50 transition-all"
          >
            <span className="font-display text-base font-bold text-white uppercase tracking-wider group-hover:text-[#CCFF00] transition-colors">
              {MONTHS_FULL[viewMonth]}
            </span>
            <span className="font-mono text-base font-black text-[#CCFF00]">
              {viewYear}
            </span>
          </button>
        </div>

        {/* Next Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextMonth}
            title="Next Month"
            className="w-8 h-8 rounded-xl bg-surface border border-white/5 hover:border-[#CCFF00]/40 flex items-center justify-center text-text-muted hover:text-[#CCFF00] transition-all"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            title="Next Year (+1)"
            className="w-8 h-8 rounded-xl bg-surface border border-white/5 hover:border-[#CCFF00]/40 flex items-center justify-center text-text-muted hover:text-[#CCFF00] transition-all"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 12-MONTH HORIZONTAL SCROLLER ───────────────────────────── */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-4">
        {MONTHS_SHORT.map((m, idx) => {
          const isMonthActive = viewMonth === idx;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setViewMonth(idx);
                setViewMode('calendar');
              }}
              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all text-center ${
                isMonthActive
                  ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]'
                  : 'bg-[#141416] text-text-muted hover:text-white hover:bg-elevated border border-white/5'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* ── MAIN INTERACTIVE AREA: CALENDAR GRID OR YEARS VIEW ────── */}
      <AnimatePresence mode="wait">
        {viewMode === 'calendar' ? (
          <motion.div
            key="calendar-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
              {DAYS_OF_WEEK.map(d => (
                <div
                  key={d}
                  className="font-mono text-[10px] font-bold text-text-muted py-1 tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Matrix Days Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading offset days */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-11 rounded-xl bg-transparent opacity-10" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selected &&
                  selected.year === viewYear &&
                  selected.month === viewMonth &&
                  selected.day === dayNum;

                return (
                  <motion.button
                    key={`day-${dayNum}`}
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-10 sm:h-11 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center justify-center relative transition-all duration-200 border ${
                      isSelected
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.6)] z-10 font-black'
                        : 'bg-[#141416] border-white/5 text-white/90 hover:border-[#CCFF00]/40 hover:bg-elevated'
                    }`}
                  >
                    {dayNum}
                    {isSelected && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-black rounded-full" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* ── YEARS SELECTOR GRID ── */
          <motion.div
            key="years-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="p-2"
          >
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-text-muted">
              <span>SELECT BIRTH YEAR</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setYearPageStart(y => y - 12)}
                  className="px-2 py-1 bg-surface border border-white/10 rounded-lg text-text-muted hover:text-white"
                >
                  ← Previous 12
                </button>
                <button
                  type="button"
                  onClick={() => setYearPageStart(y => y + 12)}
                  className="px-2 py-1 bg-surface border border-white/10 rounded-lg text-text-muted hover:text-white"
                >
                  Next 12 →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {yearsGrid.map(yr => {
                const isSelectedYear = selected?.year === yr;
                const isCurrentView = viewYear === yr;
                return (
                  <motion.button
                    key={yr}
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setViewYear(yr);
                      setViewMode('calendar');
                    }}
                    className={`py-3 px-2 rounded-xl font-mono text-sm font-bold border transition-all text-center ${
                      isSelectedYear
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.5)]'
                        : isCurrentView
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]'
                        : 'bg-[#141416] border-white/5 text-white hover:border-[#CCFF00]/30 hover:bg-elevated'
                    }`}
                  >
                    {yr}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAST AGE PRESET SHORTCUTS ───────────────────────────────── */}
      <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="text-text-muted flex items-center gap-1.5 text-[11px]">
          <Zap size={13} className="text-[#CCFF00]" />
          <span>Quick Age Jump:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[16, 18, 20, 22, 25].map(age => (
            <button
              key={age}
              type="button"
              onClick={() => setQuickAge(age)}
              className="px-2 py-1 rounded-lg bg-surface border border-white/5 hover:border-[#CCFF00]/40 text-text-secondary hover:text-[#CCFF00] text-[10px] font-mono font-bold transition-all"
            >
              {age} yrs
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
