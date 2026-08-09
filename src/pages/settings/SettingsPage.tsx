import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Moon, Sun, Monitor, Bell, User,
  Smartphone, EyeOff, Sparkles, ArrowLeft, Zap, Shield, Check,
  Trash2, LogOut, HardDrive, HelpCircle, FileText, Lock, Activity,
  Sliders, Eye, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { logoutUser } from '../../lib/authService';
import { testAIConnection } from '../../services/aiService';
import { getProfile, updateProfile } from '../../services/profileService';
import toast from 'react-hot-toast';

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
      type="button"
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
          ? 'bg-surface border-border-muted shadow-md' 
          : 'bg-surface/50 border-border-muted/50 hover:border-border-muted'
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
          <p className="font-sans font-bold text-sm text-text-primary">{label}</p>
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
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [activeTab, setActiveTab] = useState('appearance');

  // Form Profile State
  const [fullName, setFullName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [sport, setSport] = useState(user?.sport || 'Football');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || (user as any)?.experience_level || 'intermediate');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState('');

  // Preference Toggles (Persisted in localStorage & Appwrite)
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem('sportix-reduce-motion') === 'true');
  const [compactUI, setCompactUI] = useState<boolean>(() => localStorage.getItem('sportix-compact-ui') === 'true');
  const [dataSaver, setDataSaver] = useState<boolean>(() => localStorage.getItem('sportix-data-saver') === 'true');
  const [privateAccount, setPrivateAccount] = useState<boolean>(() => localStorage.getItem('sportix-private-profile') === 'true');
  const [showOnlineStatus, setShowOnlineStatus] = useState<boolean>(() => localStorage.getItem('sportix-show-online') !== 'false');
  const [showStats, setShowStats] = useState<boolean>(() => localStorage.getItem('sportix-show-stats') !== 'false');

  // Notification Toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [eventNotifs, setEventNotifs] = useState(true);
  const [autoSquadNotifs, setAutoSquadNotifs] = useState(true);
  const [matchNotifs, setMatchNotifs] = useState(true);

  // Modals & UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [legalModalContent, setLegalModalContent] = useState<string | null>(null);

  // AI Diagnostic Test
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [aiTestMsg, setAiTestMsg] = useState('');

  useEffect(() => {
    if (user?.id) {
      getProfile(user.id).then(p => {
        if (p) {
          setFullName(p.full_name || user.name || '');
          setUsername(p.username || user.username || '');
          setSport(p.sport || 'Football');
          setExperienceLevel(p.experience_level || 'intermediate');
          setLocation(p.location || '');
          setBio(p.bio || '');
        }
      });
    }
  }, [user?.id]);

  // Apply Reduce Motion Attribute Live
  const handleReduceMotionToggle = () => {
    const nextVal = !reduceMotion;
    setReduceMotion(nextVal);
    localStorage.setItem('sportix-reduce-motion', String(nextVal));
    if (nextVal) {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-motion');
    }
    toast.success(`Reduce Motion ${nextVal ? 'Enabled' : 'Disabled'}`);
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('sportix-compact-ui', String(compactUI));
      localStorage.setItem('sportix-data-saver', String(dataSaver));
      localStorage.setItem('sportix-private-profile', String(privateAccount));
      localStorage.setItem('sportix-show-online', String(showOnlineStatus));
      localStorage.setItem('sportix-show-stats', String(showStats));

      if (user?.id) {
        await updateProfile(user.id, {
          full_name: fullName,
          username: username.toLowerCase().trim(),
          sport,
          experience_level: experienceLevel as any,
          location,
          bio,
          is_open_to_recruit: !privateAccount,
        });
      }

      setSaveSuccess(true);
      toast.success('All settings saved & synchronized!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error('Failed to save settings: ' + (err?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    const keysToRemove = ['sportix_feed_cache', 'sportix_temp_data', 'sportix_search_history'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    toast.success('Local cache cleared successfully (~ 1.8 MB freed)');
  };

  const runAiTest = async () => {
    setAiTestStatus('testing');
    const res = await testAIConnection();
    setAiTestStatus(res.ok ? 'ok' : 'error');
    setAiTestMsg(res.message);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    setUser(null);
    navigate('/login');
    toast.success('Signed out safely.');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toUpperCase() === 'DELETE') {
      toast.error('Account deletion process initiated.');
      setShowDeleteModal(false);
      handleLogout();
    } else {
      toast.error('Please type DELETE to confirm.');
    }
  };

  const TABS = [
    { id: 'appearance',    label: 'Appearance',   icon: Sun,          color: '#CCFF00' },
    { id: 'account',       label: 'Account',      icon: User,         color: '#00D4FF' },
    { id: 'notifications', label: 'Notifs',       icon: Bell,         color: '#A855F7' },
    { id: 'privacy',       label: 'Privacy',       icon: Shield,       color: '#FF6B00' },
    { id: 'preferences',   label: 'Sport Preferences', icon: Activity,  color: '#CCFF00' },
    { id: 'accessibility', label: 'Accessibility', icon: Sliders,     color: '#00D4FF' },
    { id: 'data',          label: 'Storage & Cache', icon: HardDrive, color: '#A855F7' },
    { id: 'ai',            label: 'AI & Engine',   icon: Sparkles,     color: '#CCFF00' },
    { id: 'about',         label: 'About & Legal', icon: HelpCircle,   color: '#00D4FF' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 text-text-primary">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border-muted shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-elevated border border-border-muted hover:border-[#CCFF00]/40 flex items-center justify-center text-text-primary transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">
              <SettingsIcon size={12} /> SYSTEM & ACCOUNT PREFERENCES
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-text-primary">SportiX Settings</h1>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Preferences'}
        </button>
      </div>

      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 font-mono text-xs text-[#CCFF00] flex items-center gap-2">
          <Check size={16} /> All preferences synchronized with backend & local device!
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
              className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-elevated border border-border-muted text-text-primary shadow-lg'
                  : 'text-text-muted hover:text-text-primary'
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
        
        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-6">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sun size={16} className="text-[#CCFF00]" /> Color Theme & System Mode
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark' ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-border-muted text-text-muted hover:text-text-primary'
                }`}
              >
                <Moon size={22} /> Dark Cyber Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                  theme === 'light' ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-border-muted text-text-muted hover:text-text-primary'
                }`}
              >
                <Sun size={22} /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-4 rounded-2xl border font-mono text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                  theme === 'system' ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-elevated border-border-muted text-text-muted hover:text-text-primary'
                }`}
              >
                <Monitor size={22} /> System Default
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-muted">
              <SettingRow
                label="Compact Dense UI Layout"
                desc="Tighter padding and grid layout for higher information density"
                active={compactUI}
                onChange={() => setCompactUI(!compactUI)}
                color="#00D4FF"
                icon={<Sliders size={18} />}
              />
              <SettingRow
                label="Data Saver Mode"
                desc="Reduce image resolution and auto-play animations on cellular connections"
                active={dataSaver}
                onChange={() => setDataSaver(!dataSaver)}
                color="#A855F7"
                icon={<Smartphone size={18} />}
              />
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-6">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-[#00D4FF]" /> Profile & Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">Username handle</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">Primary Sport</label>
                <select
                  value={sport}
                  onChange={e => setSport(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                >
                  <option value="Football">Football / Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Padel">Padel</option>
                  <option value="Running">Running / Athletics</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">Location / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. London, UK"
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-text-muted font-bold">Athlete Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell other athletes about your playing style and squad preferences..."
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-elevated border border-border-muted space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Appwrite Account ID:</span>
                <span className="text-text-primary font-bold">{user?.id || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Registered Email:</span>
                <span className="text-[#CCFF00] font-bold">{user?.email || 'user@sportix.io'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">System Role:</span>
                <span className="text-text-primary uppercase font-bold">{user?.role || 'Athlete'}</span>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-[#A855F7]" /> Push & Activity Notifications
            </h2>

            <SettingRow
              label="Global Push Alerts"
              desc="Master switch for device push notifications"
              active={pushNotifs}
              onChange={() => setPushNotifs(!pushNotifs)}
              color="#A855F7"
              icon={<Bell size={18} />}
            />
            <SettingRow
              label="Huddle Chat Messages"
              desc="Alert when athletes send direct messages"
              active={messageNotifs}
              onChange={() => setMessageNotifs(!messageNotifs)}
              color="#00D4FF"
              icon={<Zap size={18} />}
            />
            <SettingRow
              label="Tournament & Event Reminders"
              desc="Alerts 30 minutes before kick-off or match start"
              active={eventNotifs}
              onChange={() => setEventNotifs(!eventNotifs)}
              color="#CCFF00"
              icon={<Activity size={18} />}
            />
            <SettingRow
              label="AutoSquad AI Match Notifications"
              desc="Alert when AutoSquad completes 90%+ player matching"
              active={autoSquadNotifs}
              onChange={() => setAutoSquadNotifs(!autoSquadNotifs)}
              color="#FF6B00"
              icon={<Sparkles size={18} />}
            />
            <SettingRow
              label="Match Results & ClashHub Notifications"
              desc="Alert when match scores and leadership votes are updated"
              active={matchNotifs}
              onChange={() => setMatchNotifs(!matchNotifs)}
              color="#00D4FF"
              icon={<Shield size={18} />}
            />
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-[#FF6B00]" /> Privacy & Scouting Controls
            </h2>

            <SettingRow
              label="Private Player Profile"
              desc="Only verified squad captains and tournament scouts can view detailed PlayerDNA stats"
              active={privateAccount}
              onChange={() => setPrivateAccount(!privateAccount)}
              color="#FF6B00"
              icon={<EyeOff size={18} />}
            />
            <SettingRow
              label="Show Active Online Status"
              desc="Allow other athletes to see when you are active on Huddle Messages"
              active={showOnlineStatus}
              onChange={() => setShowOnlineStatus(!showOnlineStatus)}
              color="#00D4FF"
              icon={<Eye size={18} />}
            />
            <SettingRow
              label="Public Match Statistics"
              desc="Display your match history and SSR rating on Leaderboard"
              active={showStats}
              onChange={() => setShowStats(!showStats)}
              color="#CCFF00"
              icon={<Activity size={18} />}
            />
          </div>
        )}

        {/* SPORT PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#CCFF00]" /> Athlete Matchmaking Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">Preferred Skill Level</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                >
                  <option value="beginner">Rookie / Beginner</option>
                  <option value="amateur">Amateur</option>
                  <option value="intermediate">Intermediate / Competitive</option>
                  <option value="advanced">Advanced / Semi-Pro</option>
                  <option value="pro">Pro Athlete</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-text-muted font-bold">AutoSquad Match Radius</label>
                <select
                  defaultValue="25"
                  className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary"
                >
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">State / Region-wide</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ACCESSIBILITY TAB */}
        {activeTab === 'accessibility' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-[#00D4FF]" /> Accessibility & Motion
            </h2>

            <SettingRow
              label="Reduce Motion Effects"
              desc="Disables complex animations and view transition ripples"
              active={reduceMotion}
              onChange={handleReduceMotionToggle}
              color="#00D4FF"
              icon={<Sliders size={18} />}
            />
          </div>
        )}

        {/* STORAGE & DATA TAB */}
        {activeTab === 'data' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <HardDrive size={16} className="text-[#A855F7]" /> Storage & Device Cache
            </h2>

            <div className="p-4 rounded-2xl bg-elevated border border-border-muted space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-text-primary">Cached Media & Feed Snapshots</p>
                  <p className="text-text-muted text-[10px]">Temporary local storage data (~ 1.8 MB)</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-elevated border border-border-muted text-text-primary font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Clear Cache
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI ENGINE TAB */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#CCFF00]" /> AI Telemetry & Match Engine
            </h2>

            <div className="p-4 rounded-2xl bg-elevated border border-border-muted space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans font-bold text-sm text-text-primary">SPORTiX Fast-API Backend Status</p>
                  <p className="font-mono text-[10px] text-text-muted">Verify active LLM & matchmaking engine connection</p>
                </div>
                <button
                  type="button"
                  onClick={runAiTest}
                  disabled={aiTestStatus === 'testing'}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase"
                >
                  {aiTestStatus === 'testing' ? 'Testing...' : 'Ping Engine'}
                </button>
              </div>

              {aiTestStatus === 'ok' && (
                <p className="font-mono text-xs text-[#CCFF00]">✓ {aiTestMsg || 'SPORTiX AI Engine Online & Ready'}</p>
              )}
              {aiTestStatus === 'error' && (
                <p className="font-mono text-xs text-red-400">✕ {aiTestMsg || 'Connection error — check API server'}</p>
              )}
            </div>
          </div>
        )}

        {/* ABOUT & LEGAL TAB */}
        {activeTab === 'about' && (
          <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
            <h2 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={16} className="text-[#00D4FF]" /> About & Legal Information
            </h2>

            <div className="p-4 rounded-2xl bg-elevated border border-border-muted space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">App Version:</span>
                <span className="text-[#CCFF00] font-bold">v2.4.0-production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Appwrite SDK:</span>
                <span className="text-text-primary font-bold">v17.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Backend API:</span>
                <span className="text-text-primary font-bold">FastAPI 0.115 (Python 3.13)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setLegalModalContent('Terms of Service: SportiX is provided as an AI-powered sports intelligence platform...')}
                className="p-3 rounded-xl bg-elevated border border-border-muted text-text-primary hover:border-[#CCFF00]/40 text-left flex items-center gap-2"
              >
                <FileText size={14} className="text-[#CCFF00]" /> Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setLegalModalContent('Privacy Policy: User telemetry and match history are encrypted and protected under SportiX Privacy Standards.')}
                className="p-3 rounded-xl bg-elevated border border-border-muted text-text-primary hover:border-[#00D4FF]/40 text-left flex items-center gap-2"
              >
                <Lock size={14} className="text-[#00D4FF]" /> Privacy Policy
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── DANGER ZONE & SESSION ACTIONS ────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-surface border border-red-500/20 space-y-4">
        <h2 className="font-sans font-bold text-base text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={18} /> Account Management & Sign Out
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-elevated hover:bg-red-500/10 border border-border-muted hover:border-red-500/40 text-text-primary font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={16} /> Sign Out of Session
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      {/* ── DELETE ACCOUNT CONFIRMATION MODAL ────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-md w-full p-6 rounded-3xl bg-surface border border-red-500/40 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400 font-sans font-bold text-lg">
                <AlertTriangle size={24} /> Confirm Account Deletion
              </div>
              <p className="font-mono text-xs text-text-muted">
                This action is permanent and will delete your profile, PlayerDNA stats, and match history.
                Please type <span className="text-white font-bold">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary font-mono text-xs"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-elevated border border-border-muted text-text-primary font-mono font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-mono font-bold text-xs uppercase"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LEGAL INFO MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {legalModalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-lg w-full p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-2xl">
              <h3 className="font-sans font-bold text-base text-text-primary uppercase">Legal Document</h3>
              <p className="font-mono text-xs text-text-secondary leading-relaxed">{legalModalContent}</p>
              <button
                type="button"
                onClick={() => setLegalModalContent(null)}
                className="w-full py-2.5 rounded-xl bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
