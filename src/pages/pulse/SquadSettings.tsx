import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSquadDetail, useSquadMutations } from '@/hooks/useSquads';
import { Settings, ShieldAlert, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const SquadSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { squad, loading, error } = useSquadDetail(id);
  const { updateSquad, disbandSquad } = useSquadMutations(id);
  // The server enforces this too; the flag only decides what the UI offers.
  const user = useAuthStore(state => state.user);
  const isCaptain = Boolean(squad && user && squad.captain_id === user.id);
  const updateSquadSettings = (updates: Record<string, unknown>) => void updateSquad(updates);
  const handleDisband = () => {
    if (window.confirm('Disband this squad? Every member loses access and this cannot be undone.')) {
      void disbandSquad().then(() => navigate('/pulse'));
    }
  };

  const [name, setName] = useState(squad?.name || '');
  const [formation, setFormation] = useState(squad?.formation || '4-3-3');
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6" aria-busy="true">
        <div className="h-10 w-2/3 rounded bg-elevated animate-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-elevated animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-elevated animate-shimmer" />
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-2xl bg-surface border border-border-muted p-8 text-center space-y-3">
          <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
            {error?.status === 404 ? 'Squad not found' : 'Could not load these settings'}
          </p>
          <p className="font-mono text-[11px] text-text-secondary">
            {error?.status === 404
              ? 'It may have been disbanded.'
              : error?.message ?? 'You may not be a member of this squad.'}
          </p>
          {error?.requestId && (
            <p className="font-mono text-[9px] text-text-muted">Reference: {error.requestId}</p>
          )}
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptain) return;

    updateSquadSettings({ name, formation });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/pulse/squad/${squad.$id}` },
    { id: 'analytics', label: 'Analytics', path: `/pulse/squad/${squad.$id}/analytics` },
    { id: 'chat', label: 'Squad Chat', path: `/pulse/squad/${squad.$id}/chat` },
    { id: 'history', label: 'Match History', path: `/pulse/squad/${squad.$id}/history` },
    { id: 'settings', label: 'Settings', path: `/pulse/squad/${squad.$id}/settings` }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Subnav */}
      <div className="flex gap-1.5 border-b border-border-muted pb-px font-mono text-[11px] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 border-b-2 font-bold tracking-wider transition-colors ${
              tab.id === 'settings'
                ? 'border-volt text-volt'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-[44px] leading-none uppercase text-text-primary">SQUAD SETTINGS</h1>
        <p className="font-mono text-[11px] text-text-secondary mt-1">
          Adjust configuration properties for <strong className="text-volt">{squad.name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Edit fields */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card">
          {!isCaptain ? (
            <div className="p-4 rounded-[12px] bg-danger-dim border border-danger/20 text-danger font-mono text-[12px] flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>You do not have Captain clearance to modify squad settings.</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[11px] text-text-secondary uppercase">Squad Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-base border border-border-muted rounded-[12px] px-4 py-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[11px] text-text-secondary uppercase">Default Tactical Formation</label>
                <select
                  value={formation}
                  onChange={(e) => setFormation(e.target.value)}
                  className="w-full bg-base border border-border-muted rounded-[12px] px-4 py-3 font-mono text-[12px] text-text-primary focus:outline-none focus:border-volt"
                >
                  <option value="4-3-3">4-3-3 (Attack Wide)</option>
                  <option value="4-4-2">4-4-2 (Flat Midfield)</option>
                  <option value="3-5-2">3-5-2 (Wingback Transition)</option>
                  <option value="5-3-2">5-3-2 (Defensive Lowblock)</option>
                  <option value="Motion">Motion (Basketball Default)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border-muted flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[10px] bg-volt text-volt-text font-condensed font-bold text-[14px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {/* The page warned about irreversible actions but offered none. */}
          {isCaptain && (
            <div className="mt-8 pt-6 border-t border-danger/20 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-danger">
                Danger zone
              </p>
              <button
                type="button"
                onClick={handleDisband}
                className="w-full px-4 py-3 rounded-[12px] bg-danger/10 border border-danger/40 text-danger font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-danger/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Disband this squad
              </button>
              <p className="font-mono text-[9px] text-text-muted">
                Every member loses access. This cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Right Info: General Specs */}
        <div className="p-6 rounded-[24px] bg-surface border border-border-muted/50 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="text-text-secondary" size={16} />
            <h3 className="font-display text-[15px] text-text-primary uppercase tracking-wider">SYSTEM INFORMATION</h3>
          </div>
          <div className="font-mono text-[11px] text-text-secondary space-y-2.5">
            <div className="flex justify-between">
              <span>SQUAD ID:</span>
              <strong className="text-text-primary">{squad.$id}</strong>
            </div>
            <div className="flex justify-between">
              <span>SPORT CHANNEL:</span>
              <strong className="text-volt">{squad.sport.toUpperCase()}</strong>
            </div>
            <div className="flex justify-between">
              <span>CREATION DATE:</span>
              <strong className="text-text-primary">{squad.created_at}</strong>
            </div>
            <div className="flex justify-between">
              <span>LEAD CLEARANCE:</span>
              <strong className="text-text-primary">Captain Account Only</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Save confirmation Toast */}
      {showSavedToast && (
        <div className="fixed bottom-8 right-8 p-4 rounded-[12px] bg-volt text-volt-text font-mono text-[12px] font-bold flex items-center gap-2 shadow-2xl z-50">
          <Check size={16} />
          <span>Squad settings updated successfully.</span>
        </div>
      )}
    </div>
  );
};
