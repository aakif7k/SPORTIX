import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Moon, Sun, ShieldAlert, Bell, Lock, User,
  Smartphone, EyeOff, Mail, CheckCircle2, Loader2, Trash2, Trophy,
  Sparkles, ArrowLeft, Zap, Shield, Radio, Database, Wifi, WifiOff,
  RefreshCw, AlertTriangle, MapPin, Check
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { testAIConnection } from '../../services/aiService';

// ─── NEON TOGGLE ─────────────────────────────────────────────────────────────
const NeonToggle: React.FC<{
  active: boolean;
  onChange: () => void;
  color?: string;
  disabled?: boolean;
}> = ({ active, onChange, color = '#CCFF00', disabled = false }) => {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative flex-shrink-0 focus:outline-none"
      style={{ width: 50, height: 26, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: active ? `${color}25` : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${active ? color : 'rgba(255, 255, 255, 0.15)'}`,
          boxShadow: active ? `0 0 12px ${color}55` : 'none',
        }}
      />
      <motion.div
        animate={{ x: active ? 25 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-[3px] w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: active ? color : '#71717A',
          boxShadow: active ? `0 0 8px ${color}` : 'none',
        }}
      />
    </button>
  );
};

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
const SettingRow: React.FC<{
  label: string; 
  desc: string; 
  active: boolean; 
  onChange: () => void;
  color?: string; 
  icon?: React.ReactNode; 
  badge?: string; 
  disabled?: boolean;
}> = ({ label, desc, active, onChange, color = '#CCFF00', icon, badge, disabled }) => {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
        active 
          ? 'bg-surface border-white/20 shadow-lg' 
          : 'bg-surface/50 border-border-muted/50 hover:border-white/10'
      }`}
    >
      {icon && (
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
          style={{ 
            background: active ? `${color}15` : 'rgba(255,255,255,0.05)', 
            borderColor: active ? `${color}40` : 'rgba(255,255,255,0.1)',
            color: active ? color : '#A1A1AA' 
          }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-sans font-bold text-sm text-white">{label}</p>
          {badge && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {badge}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-text-muted mt-0.5">{desc}</p>
      </div>
      <NeonToggle active={active} onChange={onChange} color={color} disabled={disabled} />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const aiSettings = useAISettingsStore();

  const [activeTab, setActiveTab] = useState('general');
  const [dataSaver, setDataSaver] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [pushLikes, setPushLikes] = useState(true);
  const [pushMentions, setPushMentions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Diagnostic Test
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [aiTestMsg, setAiTestMsg] = useState('');

  const runAiTest = async () => {
    setAiTestStatus('testing');
    const res = await testAIConnection();
    setAiTestStatus(res.ok ? 'ok' : 'error');
    setAiTestMsg(res.message);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const TABS = [
    { id: 'general',       label: 'General',     icon: SettingsIcon, color: '#CCFF00' },
    { id: 'account',       label: 'Account',      icon: User,         color: '#00D4FF' },
    { id: 'privacy',       label: 'Privacy',       icon: Shield,       color: '#FF6B00' },
    { id: 'notifications', label: 'Notifications', icon: Bell,         color: '#A855F7' },
    { id: 'ai',            label: 'AI & Telemetry', icon: Sparkles,    color: '#CCFF00' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 text-white">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#141400] via-[#0A0A0A] to-[#051214] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-elevated border border-white/10 hover:border-[#CCFF00]/40 flex items-center justify-center text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">
              <SettingsIcon size={12} /> SYSTEM PREFERENCES
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">App Settings</h1>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-xs text-[#CCFF00] flex items-center gap-2">
          <Check size={16} /> Preferences updated successfully!
        </motion.div>
      )}

      {/* ── NAVIGATION TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none bg-surface p-1.5 rounded-2xl border border-border-muted">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-elevated border border-white/20 text-white shadow-lg'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <Icon size={14} style={{ color: tab.color }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT SECTIONS ────────────────────────────────────────── */}
      <div className="space-y-6">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Sun size={16} className="text-[#CCFF00]" /> Display & System Mode
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark' ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-white/10 text-text-muted'
                }`}
              >
                <Moon size={20} /> Dark Cyber Mode
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                  theme === 'light' ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-white/10 text-text-muted'
                }`}
              >
                <Sun size={20} /> Light Mode
              </button>
            </div>

            <SettingRow
              label="Data Saver Mode"
              desc="Reduce media pre-loading and video auto-play on cellular connections"
              active={dataSaver}
              onChange={() => setDataSaver(!dataSaver)}
              color="#00D4FF"
              icon={<Smartphone size={18} />}
            />
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-[#00D4FF]" /> Account & Credentials
            </h2>

            <div className="p-4 rounded-2xl bg-elevated border border-white/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Account Name:</span>
                <span className="text-white font-bold">{user?.name || 'Athlete'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Email Address:</span>
                <span className="text-[#CCFF00]">{user?.email || 'user@sportix.io'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Account Role:</span>
                <span className="text-white uppercase font-bold">{user?.role || 'Athlete'}</span>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-[#FF6B00]" /> Privacy & Scouting Controls
            </h2>

            <SettingRow
              label="Private Player Profile"
              desc="Only verified tournament scouts and squad captains can view full PlayerDNA stats"
              active={privateAccount}
              onChange={() => setPrivateAccount(!privateAccount)}
              color="#FF6B00"
              icon={<EyeOff size={18} />}
            />
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-[#A855F7]" /> Push Notification Rules
            </h2>

            <SettingRow
              label="Tournament & Match Reminders"
              desc="Receive push alerts 30 minutes before kick-off"
              active={pushLikes}
              onChange={() => setPushLikes(!pushLikes)}
              color="#A855F7"
              icon={<Bell size={18} />}
            />
            <SettingRow
              label="AutoSquad Match Invites"
              desc="Instant alert when AI finds a 90%+ compatible team"
              active={pushMentions}
              onChange={() => setPushMentions(!pushMentions)}
              color="#00D4FF"
              icon={<Zap size={18} />}
            />
          </div>
        )}

        {/* AI TAB */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#CCFF00]" /> Gemini AI Telemetry & Diagnostics
            </h2>

            <div className="p-4 rounded-2xl bg-elevated border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans font-bold text-sm text-white">Gemini API Engine Status</p>
                  <p className="font-mono text-[10px] text-text-muted">Verify active LLM connection for AI team creation</p>
                </div>
                <button
                  onClick={runAiTest}
                  disabled={aiTestStatus === 'testing'}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase"
                >
                  {aiTestStatus === 'testing' ? 'Testing...' : 'Ping Engine'}
                </button>
              </div>

              {aiTestStatus === 'ok' && (
                <p className="font-mono text-xs text-[#CCFF00]">✓ {aiTestMsg || 'Gemini 1.5 Flash API Online & Ready'}</p>
              )}
              {aiTestStatus === 'error' && (
                <p className="font-mono text-xs text-red-400">✕ {aiTestMsg || 'Connection error — check API configuration'}</p>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
