import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, MapPin, Users, Zap, FileText } from 'lucide-react';
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
  });
  const { addEvent } = useEventStore();
  const navigate = useNavigate();

  const update = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));
  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
  const updateRule = (i: number, val: string) => setForm(f => ({ ...f, rules: f.rules.map((r, ri) => ri === i ? val : r) }));

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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">HOST A CLASH</h1>
        <p className="text-text-secondary font-label text-sm mt-0.5">Set up your tournament in ClashHub</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-1.5 ${i <= step ? 'text-volt' : 'text-text-muted'} ${i < step ? 'cursor-pointer hover:underline' : 'cursor-default'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${i < step ? 'bg-volt border-volt text-black' : i === step ? 'border-volt text-volt' : 'border-border-muted text-text-muted'}`}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              <span className="text-xs font-label hidden sm:block">{s}</span>
            </button>
            {i < 3 && <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-volt/40' : 'bg-border-muted'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 border border-volt/10">
        <AnimatePresence mode="wait">
          {/* STEP 0: BASICS */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display text-2xl text-white tracking-wide">EVENT BASICS</h2>
              <Input label="Event Name" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Pro Football 5v5 Championship" required />
              <div>
                <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Sport</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {SPORT_CATEGORIES.slice(0, 12).map(s => (
                    <button key={s.id} onClick={() => update('sport', s.id)} type="button"
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${form.sport === s.id ? 'border-volt bg-volt/10 shadow-glow-volt-sm' : 'border-border-muted bg-elevated hover:border-volt/30'}`}>
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-[9px] font-label text-text-secondary">{s.label.slice(0, 5)}</span>
                    </button>
                  ))}
                </div>
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
              <h2 className="font-display text-2xl text-white tracking-wide">RULES & REQUIREMENTS</h2>
              <Textarea label="Event Description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your event..." rows={3} />
              <Select label="Skill Level" value={form.skillLevel} onChange={e => update('skillLevel', e.target.value)}
                options={[{ value: 'amateur', label: 'Amateur' }, { value: 'semi-pro', label: 'Semi-Pro' }, { value: 'professional', label: 'Professional' }, { value: 'elite', label: 'Elite' }]} />
              <div>
                <label className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">Rules</label>
                {form.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-volt w-5">{i + 1}.</span>
                    <input value={rule} onChange={e => updateRule(i, e.target.value)} placeholder={`Rule ${i + 1}...`}
                      className="flex-1 bg-elevated border border-border-muted rounded-lg px-3 py-2 font-mono text-sm text-white placeholder-text-muted outline-none focus:border-volt/50 transition-all" />
                  </div>
                ))}
                <button onClick={addRule} className="text-xs font-label text-volt hover:underline mt-1">+ Add Rule</button>
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
              <h2 className="font-display text-2xl text-white tracking-wide">TEAM CONFIGURATION</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Max Participants" type="number" value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} icon={<Users size={14} />} />
                <Input label="Prize Pool" value={form.prizePool} onChange={e => update('prizePool', e.target.value)} placeholder="€25,000" />
                <Input label="Entry Fee" value={form.entryFee} onChange={e => update('entryFee', e.target.value)} placeholder="€150 / Free" />
              </div>
              <div className="glass-orange rounded-xl p-4 flex items-start gap-3 border">
                <Zap size={18} className="text-volt mt-0.5 flex-shrink-0" fill="currentColor" />
                <div className="flex-1">
                  <p className="font-label text-sm font-semibold text-white mb-1">AI Team Builder</p>
                  <p className="text-xs text-text-secondary font-label">Allow athletes without teams to use Gemini AI to automatically build a compatible team.</p>
                </div>
                <button onClick={() => update('aiTeamAvailable', !form.aiTeamAvailable)}
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-all relative border ${form.aiTeamAvailable ? 'bg-volt/20 border-volt/40' : 'bg-surface border-border-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${form.aiTeamAvailable ? 'left-5 bg-volt' : 'left-1 bg-text-muted'}`} />
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
              <h2 className="font-display text-2xl text-white tracking-wide">REVIEW & PUBLISH</h2>
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
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border-muted">
                    <span className="stat-label">{item.label}</span>
                    <span className="font-mono text-sm text-white capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                <Button fullWidth onClick={publish} icon={<Zap size={15} fill="black" />}>Publish Event →</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
