import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Moon, Sun, ShieldAlert, Bell, Lock, User,
  Smartphone, EyeOff, Mail, CheckCircle2, Loader2, Trash2, Trophy,
  Sparkles, ArrowLeft, Zap, Shield, Radio, Database, Wifi, WifiOff,
  RefreshCw, AlertTriangle, MapPin,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { testAIConnection } from '../../services/aiService';

const resolveColor = (color: string) => {
  if (color === '#CCFF00') {
    return document.documentElement.classList.contains('light') ? '#2D7A1F' : '#CCFF00';
  }
  return color;
};

// ─── FUTURISTIC TOGGLE ────────────────────────────────────────────────────────
const NeonToggle: React.FC<{
  active: boolean;
  onChange: () => void;
  color?: string;
  disabled?: boolean;
}> = ({ active, onChange, color = '#CCFF00', disabled = false }) => {
  const resolvedColor = resolveColor(color);
  return (
    <button
      onClick={disabled ? undefined : onChange}
      aria-pressed={active}
      disabled={disabled}
      className="relative flex-shrink-0 focus:outline-none"
      style={{ width: 52, height: 28, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 overflow-hidden"
        style={{
          background: active ? `linear-gradient(135deg, ${resolvedColor}22, ${resolvedColor}44)` : 'var(--bg-elevated)',
          border: `1px solid ${active ? resolvedColor : 'var(--border-muted)'}`,
          boxShadow: active ? `0 0 12px ${resolvedColor}55, inset 0 0 8px ${resolvedColor}11` : 'none',
        }}
      >
        {active && (
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${resolvedColor}20 2px, ${resolvedColor}20 4px)` }}
            animate={{ y: [0, -8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      <motion.div
        animate={{ x: active ? 26 : 4 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className="absolute top-[4px] w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: active ? `linear-gradient(135deg, ${resolvedColor}, ${resolvedColor}cc)` : 'var(--text-muted)',
          boxShadow: active ? `0 0 10px ${resolvedColor}88, 0 2px 6px rgba(0,0,0,0.4)` : '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {active && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-black/60" />}
      </motion.div>
    </button>
  );
};

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
const SettingRow: React.FC<{
  label: string; desc: string; active: boolean; onChange: () => void;
  color?: string; icon?: React.ReactNode; badge?: string; disabled?: boolean;
}> = ({ label, desc, active, onChange, color = '#CCFF00', icon, badge, disabled }) => {
  const resolvedColor = resolveColor(color);
  return (
    <motion.div
      whileTap={disabled ? {} : { scale: 0.99 }}
      onClick={disabled ? undefined : onChange}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 relative overflow-hidden"
      style={{
        background: active ? `${resolvedColor}06` : 'var(--bg-elevated)',
        border: `1px solid ${active ? `${resolvedColor}25` : 'var(--border-muted)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: `linear-gradient(180deg, ${resolvedColor}00, ${resolvedColor}, ${resolvedColor}00)` }} />}
      {icon && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: active ? `${resolvedColor}18` : 'var(--bg-surface)', border: `1px solid ${active ? `${resolvedColor}30` : 'var(--border-muted)'}`, color: active ? resolvedColor : 'var(--text-muted)' }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-condensed text-[15px] font-bold text-text-primary leading-tight">{label}</p>
          {badge && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: `${resolvedColor}20`, color: resolvedColor, border: `1px solid ${resolvedColor}40` }}>{badge}</span>}
        </div>
        <p className="font-mono text-[10px] text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <NeonToggle active={active} onChange={onChange} color={resolvedColor} disabled={disabled} />
    </motion.div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; color?: string; children: React.ReactNode; }> = ({ title, icon, color = '#CCFF00', children }) => {
  const resolvedColor = resolveColor(color);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--border-muted)' }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-muted)', background: `linear-gradient(90deg, ${resolvedColor}08, transparent)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${resolvedColor}18`, border: `1px solid ${resolvedColor}30`, color: resolvedColor }}>{icon}</div>
        <span className="font-display text-[15px] tracking-wider text-text-primary uppercase">{title}</span>
        <div className="flex-1" />
        <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full" style={{ background: `${resolvedColor}${40 + i * 20}` }} />)}</div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
};

// ─── AI CONNECTION STATUS PANEL ───────────────────────────────────────────────
type ConnStatus = 'idle' | 'testing' | 'ok' | 'error';

const AIConnectionPanel: React.FC = () => {
  const [status, setStatus] = useState<ConnStatus>('idle');
  const [message, setMessage] = useState('');

  const runTest = async () => {
    setStatus('testing');
    setMessage('');
    const result = await testAIConnection();
    setStatus(result.ok ? 'ok' : 'error');
    setMessage(result.message);
  };

  const colors: Record<ConnStatus, string> = { idle: '#6b7280', testing: '#f59e0b', ok: '#22c55e', error: '#ef4444' };
  const c = colors[status];

  return (
    <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: `${c}08`, border: `1px solid ${c}30` }}>
      {/* Animated glow when testing */}
      {status === 'testing' && (
        <motion.div className="absolute inset-0 rounded-2xl" style={{ border: `1px solid ${c}60` }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c}18`, border: `1px solid ${c}30`, color: c }}>
          {status === 'testing' ? <Loader2 size={15} className="animate-spin" /> : status === 'ok' ? <Wifi size={15} /> : status === 'error' ? <WifiOff size={15} /> : <Wifi size={15} />}
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="font-condensed text-[14px] font-bold text-text-primary">
            {status === 'idle' ? 'Gemini API Connection' : status === 'testing' ? 'Testing connection...' : status === 'ok' ? 'AI Connected ✓' : 'Connection Failed'}
          </p>
          {message && <p className="font-mono text-[10px] mt-0.5 break-all" style={{ color: c }}>{message}</p>}
          {status === 'idle' && <p className="font-mono text-[10px] text-text-muted mt-0.5">Tap to verify your Gemini API key</p>}
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={runTest}
          disabled={status === 'testing'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-[11px] font-bold transition-all disabled:opacity-50"
          style={{ background: `${c}18`, border: `1px solid ${c}40`, color: c }}
        >
          <RefreshCw size={12} className={status === 'testing' ? 'animate-spin' : ''} />
          {status === 'testing' ? 'Testing' : 'Test'}
        </motion.button>
      </div>
      {status === 'ok' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ label: 'Model', val: 'gemini-1.5-flash' }, { label: 'AutoSquad', val: 'ENABLED' }, { label: 'Insight API', val: 'ENABLED' }].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: '#22c55e10', border: '1px solid #22c55e25' }}>
              <span className="font-mono text-[9px] text-text-muted uppercase">{item.label}</span>
              <span className="font-mono text-[9px] font-bold" style={{ color: '#22c55e' }}>{item.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── DAILY USAGE METER ────────────────────────────────────────────────────────
const DailyUsageMeter: React.FC = () => {
  const { dailyGenerationsUsed, aiDailyLimitEnabled, remainingGenerations } = useAISettingsStore();
  const LIMIT = 3;
  const used = Math.min(dailyGenerationsUsed, LIMIT);
  const remaining = aiDailyLimitEnabled ? remainingGenerations() : Infinity;
  const pct = aiDailyLimitEnabled ? (used / LIMIT) * 100 : 0;
  const color = used >= LIMIT && aiDailyLimitEnabled ? '#ef4444' : used >= 2 && aiDailyLimitEnabled ? '#f59e0b' : '#22c55e';

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Daily Generations</span>
        <span className="font-mono text-[11px] font-bold" style={{ color }}>
          {aiDailyLimitEnabled ? `${used} / ${LIMIT}` : 'Unlimited'}
        </span>
      </div>
      {aiDailyLimitEnabled && (
        <>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}60` }}
            />
          </div>
          <p className="font-mono text-[9px] text-text-muted mt-1.5">
            {remaining === 0 ? '⚠ Limit reached — resets at midnight' : `${remaining} generation${remaining === 1 ? '' : 's'} remaining today`}
          </p>
        </>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const aiSettings = useAISettingsStore();

  const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
  const voltColor = isLight ? '#2D7A1F' : '#CCFF00';

  const [activeTab, setActiveTab] = useState('general');

  // Non-AI local state
  const [dataSaver, setDataSaver] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [allowNonFollowerMsgs, setAllowNonFollowerMsgs] = useState(true);
  const [pushLikes, setPushLikes] = useState(true);
  const [pushMentions, setPushMentions] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => { setIsSaving(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }, 1200);
  };

  const TABS = [
    { id: 'general',       label: 'General',     icon: SettingsIcon, color: voltColor },
    { id: 'account',       label: 'Account',      icon: User,         color: '#06b6d4' },
    { id: 'privacy',       label: 'Privacy',       icon: Shield,       color: '#f97316' },
    { id: 'notifications', label: 'Notifs',        icon: Bell,         color: '#a855f7' },
    { id: 'advanced',      label: 'AI & Level',    icon: Sparkles,     color: '#22c55e' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-28 md:pb-12 pt-4 sm:pt-6">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}
        >
          <ArrowLeft size={18} className="text-text-secondary" />
        </motion.button>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))', border: '1px solid var(--border-muted)' }}>
          <div className="absolute top-0 right-0 w-16 h-16 opacity-20" style={{ background: `radial-gradient(circle at top right, ${voltColor}, transparent)` }} />
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${voltColor}18`, border: `1px solid ${voltColor}30` }}>
            <SettingsIcon size={18} className="text-volt" />
          </div>
          <div>
            <h1 className="font-display text-[22px] sm:text-[28px] text-text-primary leading-none tracking-widest">SETTINGS</h1>
            <p className="font-mono text-[10px] sm:text-xs text-text-secondary mt-0.5 tracking-wider">SYSTEM CONFIG · {user?.username?.toUpperCase() || 'PLAYER'}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-volt" />
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest hidden sm:block">LIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4 md:gap-6">

        {/* ── TABS ── */}
        <div>
          {/* Mobile pill tabs */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                  style={{ background: isActive ? `${tab.color}18` : 'var(--bg-elevated)', border: `1px solid ${isActive ? tab.color + '50' : 'var(--border-muted)'}`, color: isActive ? tab.color : 'var(--text-secondary)', boxShadow: isActive ? `0 0 12px ${tab.color}30` : 'none' }}>
                  <Icon size={14} />
                  <span className="font-condensed text-[13px] font-bold whitespace-nowrap">{tab.label}</span>
                  {isActive && <motion.div layoutId="mobile-tab-dot" className="w-1 h-1 rounded-full" style={{ background: tab.color }} />}
                </motion.button>
              );
            })}
          </div>

          {/* Desktop vertical tabs */}
          <div className="hidden md:flex flex-col gap-1.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button key={tab.id} whileHover={{ x: isActive ? 0 : 3 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left overflow-hidden"
                  style={{ background: isActive ? `${tab.color}12` : 'var(--bg-elevated)', border: `1px solid ${isActive ? tab.color + '40' : 'var(--border-muted)'}`, color: isActive ? tab.color : 'var(--text-secondary)', boxShadow: isActive ? `0 0 16px ${tab.color}20` : 'none' }}>
                  {isActive && <motion.div layoutId="tab-accent" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: tab.color }} />}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isActive ? `${tab.color}20` : 'var(--bg-surface)', border: `1px solid ${isActive ? `${tab.color}40` : 'var(--border-muted)'}` }}>
                    <Icon size={15} />
                  </div>
                  <span className="font-condensed text-[14px] font-bold flex-1">{tab.label}</span>
                  {tab.id === 'advanced' && (
                    <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e80' }} />
                  )}
                </motion.button>
              );
            })}

            {/* System info */}
            <div className="mt-4 p-3 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}>
              <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-2">System</div>
              {[{ label: 'Version', value: 'v2.4.1' }, { label: 'AI Engine', value: 'Gemini 1.5' }, { label: 'Status', value: 'ONLINE', color: '#22c55e' }].map(item => (
                <div key={item.label} className="flex justify-between items-center py-0.5">
                  <span className="font-mono text-[9px] text-text-muted">{item.label}</span>
                  <span className="font-mono text-[9px] font-bold" style={{ color: item.color || 'var(--text-secondary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">

            {/* ── GENERAL ── */}
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <SectionCard title="Appearance" icon={<Sun size={15} />} color={voltColor}>
                  <div className="space-y-3">
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">THEME MODE</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ id: 'system', label: 'System', icon: Smartphone }, { id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }].map(t => {
                        const Icon = t.icon; const isSel = theme === t.id;
                        return (
                          <motion.button key={t.id} whileTap={{ scale: 0.95 }}
                            onClick={e => setTheme(t.id as any, { x: e.clientX, y: e.clientY })}
                            className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 relative overflow-hidden"
                            style={{ background: isSel ? `${voltColor}14` : 'var(--bg-surface)', border: `1px solid ${isSel ? voltColor + '50' : 'var(--border-muted)'}`, color: isSel ? voltColor : 'var(--text-secondary)', boxShadow: isSel ? `0 0 16px ${voltColor}25` : 'none' }}>
                            {isSel && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${voltColor}, transparent)` }} />}
                            <Icon size={18} />
                            <span className="font-mono text-[11px] font-bold">{t.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Nearby Search Radius" icon={<MapPin size={15} />} color={voltColor}>
                  <div className="space-y-4">
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">PROXIMITY THRESHOLD</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 10, 25, 50].map(r => {
                        const isSel = !aiSettings.isCustomRadius && aiSettings.nearbyRadius === r;
                        return (
                          <motion.button key={r} whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              aiSettings.setIsCustomRadius(false);
                              aiSettings.setNearbyRadius(r);
                            }}
                            className="flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden"
                            style={{
                              background: isSel ? `${voltColor}14` : 'var(--bg-surface)',
                              border: `1px solid ${isSel ? voltColor + '50' : 'var(--border-muted)'}`,
                              color: isSel ? voltColor : 'var(--text-secondary)',
                              boxShadow: isSel ? `0 0 16px ${voltColor}25` : 'none'
                            }}>
                            {isSel && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${voltColor}, transparent)` }} />}
                            <span className="font-display text-[15px] font-bold">{r}</span>
                            <span className="font-mono text-[8px] text-text-muted">KM</span>
                          </motion.button>
                        );
                      })}
                      {(() => {
                        const isSel = aiSettings.isCustomRadius;
                        return (
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => aiSettings.setIsCustomRadius(true)}
                            className="flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden"
                            style={{
                              background: isSel ? `${voltColor}14` : 'var(--bg-surface)',
                              border: `1px solid ${isSel ? voltColor + '50' : 'var(--border-muted)'}`,
                              color: isSel ? voltColor : 'var(--text-secondary)',
                              boxShadow: isSel ? `0 0 16px ${voltColor}25` : 'none'
                            }}>
                            {isSel && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${voltColor}, transparent)` }} />}
                            <span className="font-display text-[13px] sm:text-[14px] font-bold">CUSTOM</span>
                            <span className="font-mono text-[8px] text-text-muted">RADIUS</span>
                          </motion.button>
                        );
                      })()}
                    </div>

                    {aiSettings.isCustomRadius && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-2 border-t border-border-muted/50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-text-secondary uppercase">DRAG TO ADJUST</span>
                          <div className="flex items-center gap-1.5 bg-base border border-border-muted rounded-xl px-3 py-1.5">
                            <input
                              type="number"
                              value={aiSettings.nearbyRadius}
                              min={1}
                              max={150}
                              onChange={e => {
                                const val = Math.max(1, Math.min(150, parseInt(e.target.value, 10) || 1));
                                aiSettings.setNearbyRadius(val);
                              }}
                              className="w-12 bg-transparent text-center font-display text-[16px] text-volt focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="font-mono text-[10px] text-text-muted uppercase">KM</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-text-muted">1 KM</span>
                          <input
                            type="range"
                            min="1"
                            max="150"
                            value={aiSettings.nearbyRadius}
                            onChange={e => aiSettings.setNearbyRadius(parseInt(e.target.value, 10))}
                            className="flex-1 accent-volt cursor-pointer h-1 bg-elevated rounded-lg appearance-none"
                          />
                          <span className="font-mono text-[10px] text-text-muted">150 KM</span>
                        </div>
                      </motion.div>
                    )}

                    <div className="p-3 rounded-xl bg-elevated/40 border border-border-muted font-mono text-[9px] text-text-muted leading-relaxed">
                      💡 Proximity settings dynamically affect AutoSquad matchmaking pool, athlete suggestions, and nearby ClashHub events. Currently configured to <span className="text-volt font-bold">{aiSettings.nearbyRadius} KM</span>.
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Data & Media" icon={<Database size={15} />} color="#06b6d4">
                  <SettingRow label="Data Saver Mode" desc="Reduce media quality on cellular connections to save bandwidth" active={dataSaver} onChange={() => setDataSaver(!dataSaver)} color="#06b6d4" icon={<Radio size={14} />} />
                </SectionCard>
              </motion.div>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <SectionCard title="Profile Details" icon={<User size={15} />} color="#06b6d4">
                  <div className="space-y-3">
                    {[{ label: 'USERNAME', value: user?.username || '', type: 'text' }, { label: 'EMAIL', value: user?.email || '', type: 'email' }].map(field => (
                      <div key={field.label} className="space-y-1.5">
                        <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted">{field.label}</label>
                        <input type={field.type} defaultValue={field.value}
                          className="w-full rounded-xl px-4 py-3 font-mono text-sm text-text-primary focus:outline-none transition-all"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)' }}
                          onFocus={e => (e.target.style.borderColor = '#06b6d450')}
                          onBlur={e => (e.target.style.borderColor = 'var(--border-muted)')} />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted">BIO</label>
                      <textarea defaultValue={user?.bio || ''} rows={3}
                        className="w-full rounded-xl px-4 py-3 font-mono text-sm text-text-primary focus:outline-none transition-all resize-none"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)' }}
                        onFocus={e => (e.target.style.borderColor = '#06b6d450')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border-muted)')} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                      <AnimatePresence>
                        {saveSuccess && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: '#06b6d4' }}>
                            <CheckCircle2 size={13} /> Saved successfully
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
                        className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-condensed font-bold text-[14px] disabled:opacity-60 transition-all"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #06b6d4cc)', color: '#000', boxShadow: '0 0 16px #06b6d430' }}>
                        {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Changes'}
                      </motion.button>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <SectionCard title="Visibility & Access" icon={<EyeOff size={15} />} color="#f97316">
                  <SettingRow label="Private Account" desc="Only approved followers can see your posts and events" active={privateAccount} onChange={() => setPrivateAccount(!privateAccount)} color="#f97316" icon={<Lock size={14} />} />
                  <SettingRow label="Message Requests" desc="Allow direct messages from athletes you don't follow" active={allowNonFollowerMsgs} onChange={() => setAllowNonFollowerMsgs(!allowNonFollowerMsgs)} color="#f97316" icon={<Mail size={14} />} />
                </SectionCard>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF3B0008, var(--bg-elevated))', border: '1px solid #FF3B0030' }}>
                  <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #FF3B0025', background: '#FF3B0008' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF3B0018', border: '1px solid #FF3B0030', color: '#FF3B00' }}><ShieldAlert size={15} /></div>
                    <span className="font-display text-[15px] tracking-wider uppercase" style={{ color: '#FF3B00' }}>Danger Zone</span>
                    <div className="flex-1" />
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><div className="w-2 h-2 rounded-full bg-red-500" /></motion.div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="font-mono text-[11px] text-text-secondary leading-relaxed">Once deleted, your account, posts, and event history are permanently erased with no recovery path.</p>
                    <motion.button whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-condensed font-bold text-[13px] transition-all"
                      style={{ color: '#FF3B00', border: '1px solid #FF3B0040', background: '#FF3B0008' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FF3B00'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FF3B0008'; (e.currentTarget as HTMLElement).style.color = '#FF3B00'; }}>
                      <Trash2 size={15} /> Delete Account
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                <SectionCard title="Push Notifications" icon={<Bell size={15} />} color="#a855f7">
                  <SettingRow label="Likes & Comments" desc="Get notified when someone interacts with your drops" active={pushLikes} onChange={() => setPushLikes(!pushLikes)} color="#a855f7" icon={<Zap size={14} />} />
                  <SettingRow label="Mentions" desc="Get notified when you are tagged in posts or events" active={pushMentions} onChange={() => setPushMentions(!pushMentions)} color="#a855f7" icon={<Radio size={14} />} />
                </SectionCard>
                <SectionCard title="Email Updates" icon={<Mail size={15} />} color="#a855f7">
                  <SettingRow label="Marketing & Offers" desc="Receive news, updates, and special offers from SportiX" active={emailMarketing} onChange={() => setEmailMarketing(!emailMarketing)} color="#a855f7" icon={<Mail size={14} />} />
                </SectionCard>
              </motion.div>
            )}

            {/* ── ADVANCED / AI ── */}
            {activeTab === 'advanced' && (
              <motion.div key="advanced" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">

                {/* AI Connection */}
                <SectionCard title="Gemini AI Engine" icon={<Sparkles size={15} />} color="#22c55e">
                  <AIConnectionPanel />
                  <DailyUsageMeter />
                </SectionCard>

                {/* AutoSquad AI Config */}
                <SectionCard title="AutoSquad AI Config" icon={<Database size={15} />} color="#22c55e">
                  <SettingRow
                    label="3-Result Daily Limit"
                    desc="Restrict AutoSquad to 3 AI matchmaking generations per day to manage API quota"
                    active={aiSettings.aiDailyLimitEnabled}
                    onChange={() => aiSettings.setAiDailyLimitEnabled(!aiSettings.aiDailyLimitEnabled)}
                    color="#22c55e"
                    icon={<Shield size={14} />}
                    badge="QUOTA"
                  />
                  <SettingRow
                    label="Gemini Thought Log"
                    desc="Stream real-time AI reasoning logs while AutoSquad compiles your team"
                    active={aiSettings.aiGeminiLogsEnabled}
                    onChange={() => aiSettings.setAiGeminiLogsEnabled(!aiSettings.aiGeminiLogsEnabled)}
                    color="#22c55e"
                    icon={<Sparkles size={14} />}
                    badge="LIVE"
                  />
                  <SettingRow
                    label="Auto-Accept Squad Invites"
                    desc="Automatically join squad drafts from teammates with chemistry score ≥ 90%"
                    active={aiSettings.squadAutoAccept}
                    onChange={() => aiSettings.setSquadAutoAccept(!aiSettings.squadAutoAccept)}
                    color="#22c55e"
                    icon={<Zap size={14} />}
                  />

                  {/* Limit warning */}
                  {aiSettings.aiDailyLimitEnabled && aiSettings.remainingGenerations() === 0 && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
                      <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <p className="font-mono text-[10px]" style={{ color: '#ef4444' }}>
                        Daily AI generation limit reached. Resets at midnight. Disable the limit toggle above to bypass.
                      </p>
                    </motion.div>
                  )}
                </SectionCard>

                {/* Badge Reflection */}
                <SectionCard title="Badge Reflection" icon={<Trophy size={15} />} color="#22c55e">
                  <p className="font-mono text-[10px] text-text-muted pb-1">Control which areas display your SPORTiX level badge:</p>
                  <SettingRow label="Profile Header"  desc="Badge next to username on Athlete Profile hero card"      active={aiSettings.badgeOnProfile} onChange={() => aiSettings.setBadgeOnProfile(!aiSettings.badgeOnProfile)} color="#22c55e" icon={<User size={14} />} />
                  <SettingRow label="Community Feed"  desc="Badge next to post authors in the community feed"          active={aiSettings.badgeOnFeed}    onChange={() => aiSettings.setBadgeOnFeed(!aiSettings.badgeOnFeed)}       color="#22c55e" icon={<Radio size={14} />} />
                  <SettingRow label="Event Cards"     desc="Badge next to participants in clash and event detail views" active={aiSettings.badgeOnEvents}  onChange={() => aiSettings.setBadgeOnEvents(!aiSettings.badgeOnEvents)}   color="#22c55e" icon={<Zap size={14} />} />
                  <SettingRow label="Squad Lobbies"   desc="Badge on roster player cards in active squad view"          active={aiSettings.badgeOnSquads}  onChange={() => aiSettings.setBadgeOnSquads(!aiSettings.badgeOnSquads)}   color="#22c55e" icon={<Shield size={14} />} />
                </SectionCard>

                {/* Save */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: '#22c55e' }}>
                        <CheckCircle2 size={13} /> AI settings saved & synced
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving}
                    className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-condensed font-bold text-[14px] disabled:opacity-60 transition-all"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #22c55ecc)', color: '#000', boxShadow: '0 0 16px #22c55e30' }}>
                    {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Confirm Settings'}
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
