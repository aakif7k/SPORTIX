import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Users, Zap, Upload, Trash2, ArrowLeft } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import type { Event, SportCategory, EventFormat, ExperienceLevel } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';

const STEPS = ['Basics', 'Rules', 'Teams', 'Review'];

export const CreateEvent: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', sport: 'football' as SportCategory, date: '', venue: '', location: '',
    description: '', format: 'tournament' as EventFormat, skillLevel: 'semi-pro' as ExperienceLevel,
    maxParticipants: '32', prizePool: '', entryFee: '', rules: [''], aiTeamAvailable: true,
    bannerImage: '', bannerAlignment: 'center' as 'top' | 'center' | 'bottom',
  });
  const [imgDetails, setImgDetails] = useState<{
    width: number;
    height: number;
    aspect: 'portrait' | 'landscape' | 'square';
  } | null>(null);

  const { addEvent } = useEventStore();
  const navigate = useNavigate();

  const update = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));
  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
  const updateRule = (i: number, val: string) => setForm(f => ({ ...f, rules: f.rules.map((r, ri) => ri === i ? val : r) }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;
        
        let aspect: 'portrait' | 'landscape' | 'square' = 'landscape';
        let defaultAlign: 'top' | 'center' | 'bottom' = 'center';
        
        if (ratio < 0.8) {
          aspect = 'portrait';
          defaultAlign = 'top';
        } else if (ratio > 1.2) {
          aspect = 'landscape';
          defaultAlign = 'center';
        } else {
          aspect = 'square';
          defaultAlign = 'center';
        }
        
        setImgDetails({ width, height, aspect });
        setForm(f => ({ ...f, bannerImage: dataUrl, bannerAlignment: defaultAlign }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const publish = () => {
    const event: Event = {
      id: `e_${Date.now()}`, ...form, participants: [], teams: [], organizerId: 'cu1',
      status: 'upcoming', aiGenerated: false, tags: [form.sport],
      rules: form.rules.filter(Boolean), maxParticipants: parseInt(form.maxParticipants, 10),
      createdAt: new Date().toISOString(),
    };
    addEvent(event);
    navigate('/app/events');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/events')}
          className="p-3 rounded-xl border border-border bg-surface hover:border-volt/40 hover:bg-elevated transition-all text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer"
          title="Back to ClashHub"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-4xl text-text-primary tracking-wide uppercase">HOST A CLASH</h1>
          <p className="text-text-secondary font-label text-sm mt-0.5">Set up your tournament in ClashHub</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 ${i <= step ? 'text-accent' : 'text-text-muted'} ${i < step ? 'cursor-pointer hover:underline' : 'cursor-default'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${i < step ? 'bg-accent border-accent text-white' : i === step ? 'border-accent text-accent' : 'border-border text-text-muted'}`}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              <span className="text-xs font-label hidden sm:block">{s}</span>
            </button>
            {i < 3 && <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-accent/40' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="premium-card rounded-2xl p-6">
        <AnimatePresence mode="wait">
          {/* STEP 0: BASICS */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">EVENT BASICS</h2>
              <Input label="Event Name" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Pro Football 5v5 Championship" required />
              <div>
                <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Sport</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {SPORT_CATEGORIES.slice(0, 12).map(s => (
                    <button key={s.id} onClick={() => update('sport', s.id)} type="button"
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${form.sport === s.id ? 'border-accent bg-accent-surface text-accent shadow-sm' : 'border-border bg-elevated hover:border-accent/30'}`}>
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-[9px] font-label text-text-secondary">{s.label.slice(0, 5)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Banner Image Uploader */}
              <div>
                <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">
                  Event Banner Image
                </label>
                {form.bannerImage ? (
                  <div className="space-y-3">
                    <div className="relative h-44 rounded-xl overflow-hidden border border-border group">
                      <img 
                        src={form.bannerImage} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover transition-all duration-300"
                        style={{ 
                          objectPosition: form.bannerAlignment === 'top' 
                            ? 'center 20%' 
                            : form.bannerAlignment === 'bottom' 
                            ? 'center 80%' 
                            : 'center 50%' 
                        }} 
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, bannerImage: '', bannerAlignment: 'center' }))}
                          className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-all transform hover:scale-105"
                          title="Remove Image"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span>
                          {imgDetails?.aspect === 'portrait' ? 'Portrait' : imgDetails?.aspect === 'square' ? 'Square' : 'Landscape'} ({imgDetails?.width}x{imgDetails?.height})
                        </span>
                      </div>
                    </div>

                    <div className="bg-elevated/50 border border-border rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-label text-text-secondary">
                          Auto-aligned based on aspect ratio:
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-accent/25 text-accent border border-accent/20">
                          {imgDetails?.aspect === 'portrait' ? 'Top (20%)' : 'Center (50%)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <span className="text-[11px] font-label text-text-secondary mr-2">Adjust Alignment:</span>
                        {(['top', 'center', 'bottom'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => update('bannerAlignment', align)}
                            className={`flex-1 py-1 px-3 rounded-lg border font-mono text-[10px] font-bold uppercase transition-all ${
                              form.bannerAlignment === align
                                ? 'bg-accent border-accent text-black shadow-sm shadow-accent/20'
                                : 'bg-surface border-border text-text-secondary hover:border-accent/30'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-44 rounded-xl border border-dashed border-border bg-elevated/40 hover:bg-elevated/70 hover:border-accent/40 cursor-pointer transition-all group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                    <div className="p-3 bg-surface border border-border rounded-xl mb-2 group-hover:border-accent/30 transition-all text-text-secondary group-hover:text-accent">
                      <Upload size={18} />
                    </div>
                    <span className="text-xs font-semibold text-text-primary font-label">Upload Event Banner</span>
                    <span className="text-[10px] text-text-muted font-label mt-1">Supports PNG, JPG, WEBP (Portrait or Landscape)</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={form.date} onChange={e => update('date', e.target.value)} />
                <Select label="Format" value={form.format} onChange={e => update('format', e.target.value)}
                  options={[{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }, { value: 'solo', label: 'Solo' }, { value: 'team', label: 'Team' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Venue" value={form.venue} onChange={e => update('venue', e.target.value)} placeholder="Berlin Indoor Arena" icon={<MapPin size={14} />} />
                <Input label="Location / City" value={form.location} onChange={e => update('location', e.target.value)} placeholder="Berlin, Germany" />
              </div>
              <Button fullWidth disabled={!form.title || !form.date || !form.venue} onClick={() => setStep(1)}>Continue →</Button>
            </motion.div>
          )}

          {/* STEP 1: RULES */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">RULES & REQUIREMENTS</h2>
              <Textarea label="Event Description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your event..." rows={3} />
              <Select label="Skill Level" value={form.skillLevel} onChange={e => update('skillLevel', e.target.value)}
                options={[{ value: 'amateur', label: 'Amateur' }, { value: 'semi-pro', label: 'Semi-Pro' }, { value: 'professional', label: 'Professional' }, { value: 'elite', label: 'Elite' }]} />
              <div>
                <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Rules</label>
                {form.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-accent w-5">{i + 1}.</span>
                    <input value={rule} onChange={e => updateRule(i, e.target.value)} placeholder={`Rule ${i + 1}...`}
                      className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent/50 transition-all" />
                  </div>
                ))}
                <button onClick={addRule} className="text-xs font-label text-accent hover:underline mt-1">+ Add Rule</button>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                <Button fullWidth onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TEAM CONFIG */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">TEAM CONFIGURATION</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Max Participants" type="number" value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} icon={<Users size={14} />} />
                <Input label="Prize Pool" value={form.prizePool} onChange={e => update('prizePool', e.target.value)} placeholder="€25,000" />
                <Input label="Entry Fee" value={form.entryFee} onChange={e => update('entryFee', e.target.value)} placeholder="€150 / Free" />
              </div>
              <div className="premium-card bg-accent-surface border border-accent-border/50 rounded-xl p-4 flex items-start gap-3">
                <Zap size={18} className="text-accent mt-0.5 flex-shrink-0" fill="currentColor" />
                <div className="flex-1">
                  <p className="font-label text-sm font-semibold text-text-primary mb-1">AI Team Builder</p>
                  <p className="text-xs text-text-secondary font-label">Allow athletes without teams to use Gemini AI to automatically build a compatible team.</p>
                </div>
                <button onClick={() => update('aiTeamAvailable', !form.aiTeamAvailable)}
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-all relative border ${form.aiTeamAvailable ? 'bg-accent/20 border-accent/40' : 'bg-surface border-border'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${form.aiTeamAvailable ? 'left-5 bg-accent' : 'left-1 bg-text-muted'}`} />
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                <Button fullWidth onClick={() => setStep(3)}>Review Event →</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display text-2xl text-text-primary tracking-wide uppercase">REVIEW & PUBLISH</h2>
              {form.bannerImage && (
                <div className="relative h-32 rounded-xl overflow-hidden border border-border">
                  <img 
                    src={form.bannerImage} 
                    alt="Banner Preview" 
                    className="w-full h-full object-cover"
                    style={{ 
                      objectPosition: form.bannerAlignment === 'top' 
                        ? 'center 20%' 
                        : form.bannerAlignment === 'bottom' 
                        ? 'center 80%' 
                        : 'center 50%' 
                    }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider bg-accent text-black px-1.5 py-0.5 rounded inline-block">
                      Banner Confirmed
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {[
                  { label: 'Event Name', value: form.title },
                  { label: 'Sport', value: `${SPORT_CATEGORIES.find(s => s.id === form.sport)?.emoji} ${form.sport}` },
                  { label: 'Date', value: form.date },
                  { label: 'Venue', value: `${form.venue}, ${form.location}` },
                  { label: 'Format', value: form.format },
                  { label: 'Skill Level', value: form.skillLevel },
                  { label: 'Max Participants', value: form.maxParticipants },
                  { label: 'Prize Pool', value: form.prizePool || 'None' },
                  { label: 'AI Teams', value: form.aiTeamAvailable ? 'Enabled ✓' : 'Disabled' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border">
                    <span className="stat-label" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="font-mono text-sm text-text-primary capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                <Button fullWidth onClick={publish} icon={<Zap size={15} fill="currentColor" />}>Publish Event →</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
