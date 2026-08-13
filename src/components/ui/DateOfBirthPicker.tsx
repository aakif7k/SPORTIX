import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface DateOfBirthPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minAge?: number;
  className?: string;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  value,
  onChange,
  minAge = 13,
  className = '',
}) => {
  // Parse current YYYY-MM-DD
  const { year, month, day } = useMemo(() => {
    if (!value || !value.includes('-')) {
      return { year: '', month: '', day: '' };
    }
    const parts = value.split('-');
    return {
      year: parts[0] || '',
      month: parts[1] || '',
      day: parts[2] || '',
    };
  }, [value]);

  // Current year for limits
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - minAge;
  const minYear = currentYear - 90;

  // Generate Year options (from maxYear down to minYear)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [maxYear, minYear]);

  // Generate Day options based on selected month & year
  const daysInMonth = useMemo(() => {
    if (!month) return 31;
    const y = parseInt(year, 10) || 2000;
    const m = parseInt(month, 10);
    return new Date(y, m, 0).getDate();
  }, [month, year]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, '0');
      return { value: d, label: String(i + 1) };
    });
  }, [daysInMonth]);

  // Update handlers
  const updateDate = (newYear: string, newMonth: string, newDay: string) => {
    if (!newYear && !newMonth && !newDay) {
      onChange('');
      return;
    }
    const y = newYear || String(maxYear);
    const m = newMonth || '01';
    let d = newDay || '01';

    // Validate day boundary
    const maxDays = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
    if (parseInt(d, 10) > maxDays) {
      d = String(maxDays).padStart(2, '0');
    }

    onChange(`${y}-${m}-${d}`);
  };

  // Calculated Age & Athletic Stage
  const athleteStats = useMemo(() => {
    if (!year || !month || !day) return null;
    const dob = new Date(`${year}-${month}-${day}`);
    if (isNaN(dob.getTime())) return null;

    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 0 || age > 110) return null;

    let stage = 'Athlete';
    if (age < 16) stage = 'Next-Gen Youth';
    else if (age <= 19) stage = 'Rising Prodigy';
    else if (age <= 27) stage = 'Peak Prime';
    else if (age <= 34) stage = 'Pro Veteran';
    else stage = 'Master Division';

    const isValid = age >= minAge;

    return { age, stage, isValid };
  }, [year, month, day, minAge]);

  return (
    <div className={`w-full rounded-2xl bg-[#121214] border border-white/10 p-4 sm:p-5 space-y-4 font-sans ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center text-[#CCFF00]">
            <Calendar size={14} />
          </div>
          <div>
            <label className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Date of Birth <span className="text-[#CCFF00]">*</span>
            </label>
            <span className="text-[10px] font-mono text-text-muted">Must be at least 13 years old</span>
          </div>
        </div>

        {athleteStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${
              athleteStats.isValid
                ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {athleteStats.isValid ? (
              <>
                <CheckCircle2 size={12} />
                <span>{athleteStats.age} YRS • {athleteStats.stage}</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                <span>Min. 13 Yrs Required</span>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* 3 Minimalist Selectors in One Unified Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Month */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block pl-1">
            Month
          </label>
          <div className="relative">
            <select
              value={month}
              onChange={e => updateDate(year, e.target.value, day)}
              className="w-full bg-[#18181B] border border-white/10 hover:border-white/20 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl px-3 py-2.5 text-white font-mono text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#18181B] text-text-muted">
                Month
              </option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value} className="bg-[#18181B] text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-xs">
              ▾
            </div>
          </div>
        </div>

        {/* Day */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block pl-1">
            Day
          </label>
          <div className="relative">
            <select
              value={day}
              onChange={e => updateDate(year, month, e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 hover:border-white/20 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl px-3 py-2.5 text-white font-mono text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#18181B] text-text-muted">
                Day
              </option>
              {dayOptions.map(d => (
                <option key={d.value} value={d.value} className="bg-[#18181B] text-white">
                  {d.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-xs">
              ▾
            </div>
          </div>
        </div>

        {/* Year */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted block pl-1">
            Year
          </label>
          <div className="relative">
            <select
              value={year}
              onChange={e => updateDate(e.target.value, month, day)}
              className="w-full bg-[#18181B] border border-white/10 hover:border-white/20 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] rounded-xl px-3 py-2.5 text-white font-mono text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#18181B] text-text-muted">
                Year
              </option>
              {yearOptions.map(y => (
                <option key={y} value={String(y)} className="bg-[#18181B] text-white">
                  {y}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-xs">
              ▾
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono text-text-muted">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-[#CCFF00]" />
          <span>Quick Age:</span>
        </span>
        <div className="flex items-center gap-1.5">
          {[16, 18, 21, 24].map(presetAge => {
            const presetYear = String(currentYear - presetAge);
            const isSelected = year === presetYear;
            return (
              <button
                key={presetAge}
                type="button"
                onClick={() => updateDate(presetYear, month || '01', day || '01')}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                  isSelected
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00]'
                    : 'bg-[#18181B] text-text-secondary hover:text-white border-white/5 hover:border-white/20'
                }`}
              >
                {presetAge} yrs
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
