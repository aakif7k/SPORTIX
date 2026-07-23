import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, MapPin, Users, Zap, Upload, Trash2, ArrowLeft, Trophy, 
  Calendar, Shield, Sparkles, Plus, AlertCircle 
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { SPORT_CATEGORIES } from '../../services/mockData';
import type { Event, SportCategory, EventFormat, ExperienceLevel } from '../../types';

const STEPS = ['Basics', 'Rules & Fees', 'Teams', 'Review & Host'];

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { addEvent } = useEventStore();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', 
    sport: 'football' as SportCategory, 
    date: '', 
    venue: '', 
    location: '',
    description: '', 
    format: 'tournament' as EventFormat, 
    skillLevel: 'semi-pro' as ExperienceLevel,
    maxParticipants: '32', 
    prizePool: '€1,000', 
    entryFee: '€20', 
    rules: ['Must arrive 15 minutes before kick-off', 'Shin guards mandatory for all players'], 
    aiTeamAvailable: true,
    bannerImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', 
    bannerAlignment: 'center' as 'top' | 'center' | 'bottom',
  });

  const update = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));
  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
  const updateRule = (i: number, val: string) => setForm(f => ({ ...f, rules: f.rules.map((r, ri) => ri === i ? val : r) }));
  const removeRule = (i: number) => setForm(f => ({ ...f, rules: f.rules.filter((_, ri) => ri !== i) }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setForm(f => ({ ...f, bannerImage: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const publish = () => {
    const newEvent: Event = {
      id: `e_${Date.now()}`,
      ...form,
      participants: ['cu1'],
      teams: [],
      organizerId: 'cu1',
      status: 'upcoming',
      aiGenerated: false,
      tags: [form.sport],
      rules: form.rules.filter(Boolean),
      maxParticipants: parseInt(form.maxParticipants, 10) || 32,
      createdAt: new Date().toISOString(),
    };
    addEvent(newEvent);
    navigate(`/app/events/${newEvent.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 text-white">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-surface border border-border-muted shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/events')}
            className="w-10 h-10 rounded-2xl bg-elevated border border-white/10 hover:border-[#FF6B00]/40 flex items-center justify-center text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest">
              <Trophy size={12} /> TOURNAMENT ORGANIZER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Host Tournament</h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/events/manage')}
          className="hidden sm:flex px-4 py-2 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] font-mono text-xs font-bold uppercase tracking-wider"
        >
          My Events
        </button>
      </div>

      {/* ── STEP INDICATOR ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 bg-surface p-2 rounded-2xl border border-border-muted">
        {STEPS.map((s, idx) => (
          <button
            key={s}
            onClick={() => idx <= step && setStep(idx)}
            className={`py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              step === idx 
                ? 'bg-[#FF6B00] text-black shadow-[0_0_12px_rgba(255,107,0,0.3)]' 
                : idx < step 
                ? 'bg-elevated text-[#CCFF00]' 
                : 'text-text-muted'
            }`}
          >
            {idx < step ? <Check size={14} /> : <span>{idx + 1}.</span>}
            <span className="hidden sm:inline">{s}</span>
          </button>
        ))}
      </div>

      {/* ── FORM STEP CONTENT ───────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-muted space-y-6 shadow-2xl">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: BASICS */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="font-sans font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={18} className="text-[#FF6B00]" /> Step 1: Tournament Basics
              </h2>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-text-muted uppercase">Tournament Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Champions League 5v5"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Sport Category</label>
                  <select
                    value={form.sport}
                    onChange={e => update('sport', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF6B00] capitalize"
                  >
                    {SPORT_CATEGORIES.map(s => (
                      <option key={s.id} value={s.id} className="bg-surface">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Match Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => update('date', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Venue / Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Olympic Turf Arena"
                    value={form.venue}
                    onChange={e => update('venue', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-text-muted uppercase">Tournament Banner Image</label>
                <div className="flex items-center gap-4">
                  {form.bannerImage && (
                    <img src={form.bannerImage} alt="Banner Preview" className="w-20 h-14 rounded-xl object-cover border border-white/10" />
                  )}
                  <label className="px-4 py-2.5 rounded-xl bg-elevated border border-white/10 hover:border-[#FF6B00] text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-2">
                    <Upload size={14} /> Upload Banner
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: RULES & FEES */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="font-sans font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <Trophy size={18} className="text-[#CCFF00]" /> Step 2: Prizes & Rules
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Prize Pool</label>
                  <input
                    type="text"
                    placeholder="e.g. €1,000 Cash + Trophy"
                    value={form.prizePool}
                    onChange={e => update('prizePool', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Entry Fee per Player/Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Free or €20"
                    value={form.entryFee}
                    onChange={e => update('entryFee', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs font-bold text-text-muted uppercase">Tournament Rules</label>
                {form.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Rule ${idx + 1}`}
                      value={rule}
                      onChange={e => updateRule(idx, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-elevated border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <button onClick={() => removeRule(idx)} className="p-2 text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addRule}
                  className="px-3 py-1.5 rounded-xl bg-elevated border border-white/10 text-xs font-mono font-bold text-[#CCFF00] flex items-center gap-1"
                >
                  <Plus size={14} /> Add Rule
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TEAMS */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="font-sans font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <Users size={18} className="text-[#00D4FF]" /> Step 3: Squad Limits & Format
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Max Participants</label>
                  <input
                    type="number"
                    value={form.maxParticipants}
                    onChange={e => update('maxParticipants', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold text-text-muted uppercase">Skill Level</label>
                  <select
                    value={form.skillLevel}
                    onChange={e => update('skillLevel', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF6B00] capitalize"
                  >
                    <option value="amateur" className="bg-surface">Amateur</option>
                    <option value="semi-pro" className="bg-surface">Semi-Pro</option>
                    <option value="pro" className="bg-surface">Pro</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW & PUBLISH */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <h2 className="font-sans font-bold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <Check size={18} className="text-[#CCFF00]" /> Step 4: Review & Publish
              </h2>

              <div className="p-4 rounded-2xl bg-elevated border border-white/10 space-y-2">
                <p className="font-mono text-xs text-[#FF6B00] font-bold">TITLE: {form.title || 'Untitled Clash'}</p>
                <p className="font-mono text-xs text-text-muted">SPORT: {form.sport.toUpperCase()} | DATE: {form.date || 'TBD'}</p>
                <p className="font-mono text-xs text-text-muted">LOCATION: {form.venue}, {form.location}</p>
                <p className="font-mono text-xs text-[#CCFF00]">PRIZE: {form.prizePool} | FEE: {form.entryFee}</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl bg-elevated border border-white/10 font-mono text-xs font-bold uppercase"
            >
              Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!form.title}
              className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ff7b1a] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={publish}
              className="px-6 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(204,255,0,0.4)]"
            >
              🚀 Launch Tournament Live
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
