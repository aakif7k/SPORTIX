import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin, Camera, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const EXPERIENCE_LEVELS = [
  { id: 'amateur', label: 'Amateur', desc: 'Recreational athlete' },
  { id: 'semi-pro', label: 'Semi-Pro', desc: 'Competitive, part-time' },
  { id: 'professional', label: 'Professional', desc: 'Full-time athlete' },
  { id: 'elite', label: 'Elite', desc: 'National / World level' },
];

const STEP_LABELS = ['Sport', 'Experience', 'Location', 'Connect'];

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const { updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const progressPct = ((step + 1) / 4) * 100;

  const finishOnboarding = () => {
    updateProfile({ sport: selectedSports[0] as any, sports: selectedSports as any[], experienceLevel: experienceLevel as any, location, bio });
    navigate('/app/feed');
  };

  const toggleSport = (id: string) => {
    setSelectedSports(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 bg-grid-sm relative">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(204,255,0,0.04) 0%, transparent 60%)' }} />
      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-volt rounded-lg flex items-center justify-center"><Zap size={16} className="text-black" fill="black" /></div>
            <span className="font-display text-2xl text-volt tracking-widest">SPORTIX</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {STEP_LABELS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1 ${i <= step ? 'text-volt' : 'text-text-muted'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${i < step ? 'bg-volt border-volt text-black' : i === step ? 'border-volt text-volt' : 'border-border-muted'}`}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </div>
                  <span className="text-xs font-label hidden sm:block">{label}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px bg-border-muted" />}
              </React.Fragment>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-elevated rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} className="h-full bg-volt rounded-full shadow-glow-volt-sm" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 border border-volt/10">
          <AnimatePresence mode="wait">
            {/* STEP 0: Sport Selection */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-3xl text-white mb-1 tracking-wide">YOUR SPORT</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Select up to 3 sports</p>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {SPORT_CATEGORIES.map(sport => (
                    <motion.button key={sport.id} whileTap={{ scale: 0.95 }} onClick={() => toggleSport(sport.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${selectedSports.includes(sport.id) ? 'border-volt bg-volt/10 shadow-glow-volt-sm' : 'border-border-muted bg-elevated hover:border-volt/30'}`}>
                      <span className="text-2xl">{sport.emoji}</span>
                      <span className="text-[10px] font-label text-text-secondary leading-tight">{sport.label}</span>
                    </motion.button>
                  ))}
                </div>
                <Button fullWidth disabled={selectedSports.length === 0} onClick={() => setStep(1)} size="lg">
                  Continue ({selectedSports.length} selected) →
                </Button>
              </motion.div>
            )}

            {/* STEP 1: Experience */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-3xl text-white mb-1 tracking-wide">YOUR LEVEL</h2>
                <p className="text-text-secondary font-label text-sm mb-5">How do you compete?</p>
                <div className="space-y-3 mb-6">
                  {EXPERIENCE_LEVELS.map(level => (
                    <motion.button key={level.id} whileTap={{ scale: 0.99 }} onClick={() => setExperienceLevel(level.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${experienceLevel === level.id ? 'border-volt bg-volt/10 shadow-glow-volt-sm' : 'border-border-muted bg-elevated hover:border-volt/30'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${experienceLevel === level.id ? 'border-volt bg-volt' : 'border-border-muted'}`} />
                      <div>
                        <p className={`font-label text-sm font-semibold ${experienceLevel === level.id ? 'text-volt' : 'text-white'}`}>{level.label}</p>
                        <p className="text-xs text-text-secondary">{level.desc}</p>
                      </div>
                    </motion.button>
                  ))}
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
                <h2 className="font-display text-3xl text-white mb-1 tracking-wide">YOUR BASE</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Where do you train?</p>
                <div className="space-y-4 mb-6">
                  <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Berlin, Germany" icon={<MapPin size={15} />} />
                  <div>
                    <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Professional midfielder. Champions League finalist..." rows={3}
                      className="w-full bg-elevated border border-border-muted rounded-lg font-mono text-sm text-white placeholder-text-muted px-4 py-3 resize-none outline-none focus:border-volt/50 transition-all" />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border-muted bg-elevated">
                    <div className="w-12 h-12 rounded-full bg-surface border-2 border-dashed border-border-muted flex items-center justify-center text-text-muted">
                      <Camera size={20} />
                    </div>
                    <div>
                      <p className="font-label text-sm font-medium text-white">Profile Photo</p>
                      <p className="text-xs text-text-secondary">Upload a photo (optional)</p>
                    </div>
                    <button className="ml-auto text-xs font-label px-3 py-1.5 rounded border border-volt/30 text-volt hover:bg-volt/10 transition-all">Upload</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button fullWidth disabled={!location} onClick={() => setStep(3)}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Connect */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display text-3xl text-white mb-1 tracking-wide">CONNECT</h2>
                <p className="text-text-secondary font-label text-sm mb-5">Follow athletes in your sport</p>
                <div className="space-y-3 mb-6">
                  {['Marcus Thielemann', 'Priya Krishnamurthy', 'Isabela Moraes', 'Yuki Tanaka'].map((name, i) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-xl border border-border-muted bg-elevated">
                      <img src={`https://i.pravatar.cc/40?img=${11 + i}`} alt={name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-label text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-text-secondary">{['Football • Pro', 'Tennis • Elite', 'Swimming • Olympic', 'MMA • Pro'][i]}</p>
                      </div>
                      <button className="text-xs font-label px-3 py-1.5 rounded-lg bg-volt text-black hover:shadow-glow-volt-sm transition-all font-semibold">Follow</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                  <Button fullWidth onClick={finishOnboarding} icon={<Zap size={16} fill="black" />}>Enter SportiX →</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
