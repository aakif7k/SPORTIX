import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Camera, Check, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SPORT_CATEGORIES, GLOBAL_SPORTS } from '../../services/mockData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const EXPERIENCE_LEVELS = [
  { id: 'amateur', label: 'Amateur', desc: 'Recreational athlete' },
  { id: 'semi-pro', label: 'Semi-Pro', desc: 'Competitive, part-time' },
  { id: 'professional', label: 'Professional', desc: 'Full-time athlete' },
  { id: 'elite', label: 'Elite', desc: 'National / World level' },
];

const SPORT_ICONS: Record<string, React.ReactNode> = {
  football: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  cricket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  basketball: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M5.636 5.636a9 9 0 1 0 12.728 12.728A9 9 0 0 0 5.636 5.636z"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>,
  running: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4v3h2l2-1.5L9.5 12 7 17h3l2-4.5h2L15 15h3v-3h-2l-1.5-2.5V7l2-2z"/></svg>,
  swimming: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M2 16h20"/><path d="M6 8v4"/><path d="M10 8v4"/><path d="M14 8v4"/><path d="M18 8v4"/></svg>,
  tennis: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M4.93 4.93l14.14 14.14"/><path d="M4.93 19.07L19.07 4.93"/></svg>,
  boxing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z"/><path d="M10 6V4"/><path d="M14 6V4"/></svg>,
  cycling: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="4"/><circle cx="19" cy="18" r="4"/><path d="M5 18l4-9 3-2 3 2 4 9"/><path d="M12 7v5l-4 6"/></svg>,
  default: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
};

const STEP_LABELS = ['Sport', 'Experience', 'Location', 'Connect'];

const athletes = [
  { name: 'Marcus Thielemann', role: 'Football • Pro', img: 'https://i.pravatar.cc/100?img=11' },
  { name: 'Priya Krishnamurthy', role: 'Tennis • Elite', img: 'https://i.pravatar.cc/100?img=47' },
  { name: 'Isabela Moraes', role: 'Swimming • Olympic', img: 'https://i.pravatar.cc/100?img=9' },
  { name: 'Yuki Tanaka', role: 'MMA • Pro', img: 'https://i.pravatar.cc/100?img=18' }
];

const SkillLevelBars: React.FC<{ level: string; isSelected: boolean }> = ({ level, isSelected }) => {
  const fillCounts: Record<string, number> = {
    'amateur': 1,
    'semi-pro': 2,
    'professional': 3,
    'elite': 4,
  };
  const count = fillCounts[level] || 1;

  return (
    <div className="flex gap-1 items-center flex-shrink-0">
      {[1, 2, 3, 4].map((bar) => {
        const isFilled = bar <= count;
        return (
          <motion.div
            key={bar}
            initial={{ scaleY: 0.3, opacity: 0.3 }}
            animate={{ 
              scaleY: isSelected && isFilled ? [1, 1.25, 1] : 1,
              opacity: isFilled ? 1 : 0.25,
            }}
            transition={{
              duration: 0.3,
              delay: bar * 0.05,
              ease: 'easeOut'
            }}
            className="w-1.5 h-6 rounded-sm transition-all duration-300"
            style={{
              transformOrigin: 'bottom',
              backgroundColor: isFilled ? 'var(--accent)' : 'var(--border)',
              boxShadow: isSelected && isFilled ? '0 0 8px var(--accent-glow)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const { updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [followedAthletes, setFollowedAthletes] = useState<string[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const progressPct = ((step + 1) / 4) * 100;

  const finishOnboarding = () => {
    updateProfile({ 
      sport: selectedSports[0] as any, 
      sports: selectedSports as any[], 
      experienceLevel: experienceLevel as any, 
      location, 
      bio,
      avatar: uploadedPhoto || undefined
    });
    navigate('/app/feed');
  };

  const toggleSport = (id: string) => {
    setSelectedSports(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id) 
        : prev.length < 3 
          ? [...prev, id] 
          : prev
    );
  };

  const visibleSports = React.useMemo(() => {
    if (searchQuery.trim() !== '') {
      return GLOBAL_SPORTS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Default list: first 8 sports categories
    return SPORT_CATEGORIES.slice(0, 8);
  }, [searchQuery]);

  const handleMockUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedPhoto(`https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50) + 1}`);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleLocateBase = () => {
    if (isLocating) return;
    setIsLocating(true);
    const locations = [
      'Munich, Germany',
      'Tokyo, Japan',
      'Los Angeles, USA',
      'London, UK',
      'Paris, France',
      'Sydney, Australia',
      'Berlin, Germany'
    ];
    setTimeout(() => {
      const randomLoc = locations[Math.floor(Math.random() * locations.length)];
      setLocation(randomLoc);
      setIsLocating(false);
    }, 1500);
  };

  const handleFollowAll = () => {
    athletes.forEach((ath, index) => {
      setTimeout(() => {
        setFollowedAthletes(prev => {
          if (!prev.includes(ath.name)) {
            return [...prev, ath.name];
          }
          return prev;
        });
      }, index * 200);
    });
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow) 0%, transparent 60%)' }} />
      <div className="w-full max-w-xl relative z-10 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-volt rounded-lg flex items-center justify-center"><Zap size={16} className="text-volt-text" fill="currentColor" /></div>
            <span className="font-display text-2xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <div className="flex items-center justify-between gap-1 mb-3">
            {STEP_LABELS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1.5 ${i <= step ? 'text-volt' : 'text-text-muted'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${i < step ? 'bg-volt border-volt text-volt-text' : i === step ? 'border-volt text-volt shadow-[0_0_8px_var(--accent-glow)]' : 'border-border-muted'}`}>
                    {i < step ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className="text-xs font-label hidden sm:block tracking-wide uppercase">{label}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px bg-border-muted" />}
              </React.Fragment>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden border border-border-muted">
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} className="h-full bg-volt rounded-full shadow-glow-volt-sm" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8 border border-border-glow relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 0: Sport Selection */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-[28px] text-text-primary mb-1 tracking-widest relative">YOUR SPORT <span className="absolute bottom-0 left-0 w-12 h-[2px] bg-volt"></span></h2>
                <p className="text-text-secondary font-mono text-xs mb-5 mt-2">SELECT UP TO 3 SPORTS · WE WILL CUSTOMIZE YOUR FEED</p>
                
                {/* Removable Tag Pills */}
                {selectedSports.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl border border-border-muted bg-elevated min-h-[46px] items-center">
                    {selectedSports.map(id => {
                      const sport = GLOBAL_SPORTS.find(s => s.id === id) || { 
                        label: id.charAt(0).toUpperCase() + id.slice(1), 
                        emoji: '🏆', 
                        color: 'var(--accent)' 
                      };
                      return (
                        <motion.div
                          key={id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-volt-dim border-border-glow text-volt text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
                        >
                          <span>{sport.emoji} {sport.label}</span>
                          <button
                            onClick={() => toggleSport(id)}
                            className="hover:text-text-primary transition-colors ml-1 p-0.5 rounded-full hover:bg-volt-dim"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-xl border border-dashed border-border-muted bg-elevated/50 text-center text-xs text-text-muted font-mono tracking-wider">
                    NO SPORTS SELECTED YET (MAX 3)
                  </div>
                )}

                {/* Instant Inline Glassmorphism Search Bar */}
                <div className="relative mb-5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search size={16} className="text-text-muted" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search sports (e.g. Surfing, MMA, Badminton...)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-border-muted bg-elevated text-sm text-text-primary placeholder-text-muted outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
                  {visibleSports.map(sport => {
                    const isSelected = selectedSports.includes(sport.id);
                    return (
                      <motion.button 
                        key={sport.id} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={() => toggleSport(sport.id)}
                        className={`relative h-[100px] w-full flex flex-col items-center justify-center gap-2.5 rounded-[16px] border transition-all duration-300 group
                        ${isSelected 
                          ? 'bg-volt-dim border-volt shadow-card scale-[1.03] text-accent-text' 
                          : 'bg-surface border-border-muted hover:border-volt/35 hover:-translate-y-[2px] text-text-secondary hover:text-text-primary'}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-volt flex items-center justify-center shadow-sm">
                            <Check size={10} className="text-volt-text stroke-[3]" />
                          </div>
                        )}
                        <div className={`w-8 h-8 flex items-center justify-center transition-colors duration-200 ${isSelected ? 'text-accent-text' : 'text-text-muted group-hover:text-volt'}`}>
                          {SPORT_ICONS[sport.id] || <span className="text-2xl leading-none">{sport.emoji}</span>}
                        </div>
                        <span className={`text-[10px] font-display uppercase tracking-[1.5px] transition-colors ${isSelected ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
                          {sport.label}
                        </span>
                      </motion.button>
                    );
                  })}

                  {/* 9th Box: Others (only shown when searchQuery is empty) */}
                  {searchQuery.trim() === '' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => searchInputRef.current?.focus()}
                      className="relative h-[100px] w-full flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed bg-surface border-border-muted hover:border-volt/35 hover:-translate-y-[2px] text-text-secondary hover:text-text-primary transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center text-text-muted group-hover:text-volt">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-display uppercase tracking-[1.5px] text-text-primary">
                          Others
                        </span>
                        <span className="text-[8px] font-mono text-text-secondary mt-0.5 px-1 leading-tight">
                          Didn't find your sports?
                        </span>
                      </div>
                    </motion.button>
                  )}

                  {/* Add Custom Sport Card */}
                  {searchQuery.trim() !== '' && !visibleSports.some(s => s.label.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                    <motion.button 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        const newSportId = searchQuery.trim().toLowerCase();
                        toggleSport(newSportId);
                      }}
                      className={`relative h-[100px] w-full flex flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed transition-all duration-300 group
                      ${selectedSports.includes(searchQuery.trim().toLowerCase())
                        ? 'bg-volt-dim border-volt shadow-card scale-[1.03]' 
                        : 'bg-surface/50 border-border-muted hover:border-volt/50 hover:-translate-y-[2px] text-text-secondary hover:text-text-primary'}`}
                    >
                      {selectedSports.includes(searchQuery.trim().toLowerCase()) && (
                        <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-volt flex items-center justify-center shadow-sm">
                          <Check size={10} className="text-volt-text stroke-[3]" />
                        </div>
                      )}
                      <div className="w-8 h-8 flex items-center justify-center text-volt animate-pulse">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 px-2 text-center min-w-0 w-full">
                        <span className="text-[10px] font-display uppercase tracking-[1.2px] truncate w-full text-text-primary">
                          Add "{searchQuery.trim()}"
                        </span>
                        <span className="text-[8px] font-mono text-text-muted">CUSTOM SPORT</span>
                      </div>
                    </motion.button>
                  )}

                  {visibleSports.length === 0 && searchQuery.trim() === '' && (
                    <div className="col-span-full py-8 text-center text-xs text-text-muted font-mono tracking-wider">
                      NO SPORTS AVAILABLE
                    </div>
                  )}
                </div>

                <Button fullWidth disabled={selectedSports.length === 0} onClick={() => setStep(1)} size="lg">
                  Continue ({selectedSports.length} of 3 selected) →
                </Button>
              </motion.div>
            )}

            {/* STEP 1: Experience */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-3xl text-[var(--text-primary)] mb-1 tracking-wide uppercase">YOUR LEVEL</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Select your current competitive status</p>
                
                <div className="space-y-3 mb-6">
                  {EXPERIENCE_LEVELS.map(level => {
                    const isSelected = experienceLevel === level.id;
                    return (
                      <motion.button 
                        key={level.id} 
                        whileTap={{ scale: 0.99 }} 
                        onClick={() => setExperienceLevel(level.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group
                        ${isSelected 
                          ? 'border-volt bg-volt/10 shadow-[0_0_12px_rgba(204,255,0,0.12)]' 
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-volt/30'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-volt bg-volt' : 'border-border'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-volt-text" />}
                          </div>
                          <div>
                            <p className={`font-label text-sm font-semibold transition-colors ${isSelected ? 'text-accent-text' : 'text-[var(--text-primary)]'}`}>{level.label}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{level.desc}</p>
                          </div>
                        </div>
                        {/* SVG indicator bars representing level tiers */}
                        <SkillLevelBars level={level.id} isSelected={isSelected} />
                      </motion.button>
                    );
                  })}
                </div>
                
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                  <Button fullWidth disabled={!experienceLevel} onClick={() => setStep(2)}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Location + Bio */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-3xl text-[var(--text-primary)] mb-1 tracking-wide uppercase">YOUR BASE</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Configure geographical coordinates & profile avatar</p>
                
                <div className="space-y-4 mb-6">
                  {/* Location Input with Mock GPS Scanner */}
                  <div className="relative">
                    <Input
                      label="Location / Base Coordinates"
                      value={isLocating ? 'CONNECTING GRID...' : location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Berlin, Germany"
                      disabled={isLocating}
                      icon={<MapPin size={15} className={isLocating ? 'text-volt animate-ping' : 'text-text-secondary'} />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={handleLocateBase}
                          disabled={isLocating}
                          className="p-1 rounded-md bg-volt/10 hover:bg-volt/20 text-volt transition-colors flex items-center justify-center -mr-1"
                          title="Locate base"
                        >
                          {isLocating ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-3.5 h-3.5 border-2 border-volt border-t-transparent rounded-full"
                            />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Bio</label>
                    <textarea 
                      value={bio} 
                      onChange={e => setBio(e.target.value)} 
                      placeholder="Professional midfielder. Champions League finalist..." 
                      rows={3}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-mono text-sm text-[var(--text-primary)] placeholder-text-muted px-4 py-3 resize-none outline-none focus:border-volt/50 transition-all focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)]" 
                    />
                  </div>

                  {/* Profile Photo auto-scan uploader */}
                  <div className="relative">
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Profile Avatar</label>
                    <div 
                      onClick={handleMockUpload}
                      className="relative border-2 border-dashed border-volt/25 hover:border-volt/50 bg-[var(--bg-elevated)] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all duration-300"
                    >
                      {isUploading && (
                        <>
                          <motion.div 
                            className="absolute left-0 right-0 h-0.5 bg-volt shadow-[0_0_8px_#CCFF00] z-20"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          />
                          <div className="absolute inset-0 bg-volt/5 flex flex-col items-center justify-center z-20">
                            <span className="font-mono text-volt text-xs font-bold tracking-widest">SCANNING BIOMETRICS...</span>
                            <span className="font-mono text-volt text-2xl font-bold mt-1">{uploadProgress}%</span>
                          </div>
                        </>
                      )}
                      
                      {uploadedPhoto ? (
                        <div className="flex items-center gap-4 w-full relative z-10">
                          <div className="relative w-14 h-14 rounded-full overflow-hidden border border-volt shadow-[0_0_10px_rgba(204,255,0,0.3)] flex-shrink-0">
                            <img src={uploadedPhoto} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-label text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">SYNC ESTABLISHED</p>
                            <p className="font-mono text-[10px] text-volt uppercase tracking-wider">IDENTITY VERIFIED</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedPhoto(null);
                            }}
                            className="ml-auto text-xs text-text-muted hover:text-danger font-label transition-colors p-1"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center py-2 relative z-10">
                          <div className="w-10 h-10 rounded-full bg-volt/10 flex items-center justify-center text-volt group-hover:scale-115 transition-all duration-300">
                            <Camera size={18} />
                          </div>
                          <div>
                            <p className="font-label text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">UPLOAD AVATAR</p>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono">Click to scan/upload biological record</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button fullWidth disabled={!location || isLocating || isUploading} onClick={() => setStep(3)}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Connect */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="font-display text-3xl text-[var(--text-primary)] tracking-wide uppercase">CONNECT</h2>
                    <p className="text-text-secondary font-label text-sm">Follow matching athletes nearby</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleFollowAll}
                    className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-volt/30 text-volt hover:bg-volt/10 transition-all font-semibold uppercase tracking-wider"
                  >
                    ⚡ Follow All
                  </motion.button>
                </div>

                <div className="space-y-3 mb-6">
                  {athletes.map((ath) => {
                    const isFollowing = followedAthletes.includes(ath.name);
                    return (
                      <div key={ath.name} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] relative overflow-hidden transition-all duration-300">
                        {isFollowing && (
                          <motion.div
                            key={`ripple-${ath.name}`}
                            className="absolute inset-0 border-2 border-volt rounded-xl pointer-events-none z-10"
                            initial={{ opacity: 1, scale: 0.98 }}
                            animate={{ opacity: 0, scale: 1.04 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        )}
                        <img src={ath.img} alt={ath.name} className="w-10 h-10 rounded-full object-cover border border-[var(--border)]" />
                        <div className="flex-1">
                          <p className="font-label text-sm font-medium text-[var(--text-primary)]">{ath.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{ath.role}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setFollowedAthletes(prev => 
                              prev.includes(ath.name) 
                                ? prev.filter(name => name !== ath.name) 
                                : [...prev, ath.name]
                            );
                          }}
                          className={`text-xs font-label px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1 ${
                            isFollowing 
                              ? 'bg-volt/10 text-volt border border-volt/30 shadow-[0_0_8px_rgba(204,255,0,0.15)]' 
                              : 'bg-volt text-volt-text hover:shadow-glow-volt-sm'
                          }`}
                        >
                          {isFollowing ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1"
                            >
                              <Check size={12} strokeWidth={3} /> Following
                            </motion.span>
                          ) : (
                            'Follow'
                          )}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                  <Button fullWidth onClick={finishOnboarding} icon={<Zap size={16} fill="currentColor" />}>Enter SportiX →</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
