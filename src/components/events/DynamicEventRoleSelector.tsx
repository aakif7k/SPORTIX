/**
 * DynamicEventRoleSelector.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal sport-role selector for player join and role change.
 * Reads sport roles from sportix_sport_roles dynamically without hard-coding.
 * Displays live remaining space for each role.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Users } from 'lucide-react';
import { getSportRoleDataSync, getAllSportsRoles, type SportsRoleData } from '../../services/sportsRoleService';
import { extractRoleDefinitions } from '../../services/roleAllocationEngine';

interface DynamicEventRoleSelectorProps {
  sportName: string;
  selectedRole?: string | null;
  onSelectRole: (role: string) => void;
  roleRemainingSpace?: Record<string, number>;
  disabled?: boolean;
}

export const DynamicEventRoleSelector: React.FC<DynamicEventRoleSelectorProps> = ({
  sportName,
  selectedRole,
  onSelectRole,
  roleRemainingSpace = {},
  disabled = false,
}) => {
  const [sportConfig, setSportConfig] = useState<SportsRoleData | undefined>(() =>
    getSportRoleDataSync(sportName)
  );

  useEffect(() => {
    // If not cached, fetch all sports roles
    getAllSportsRoles().then(() => {
      setSportConfig(getSportRoleDataSync(sportName));
    });
  }, [sportName]);

  const roles = sportConfig
    ? extractRoleDefinitions(sportConfig)
    : [
        { role: 'Captain', required: 1 },
        { role: 'Strategist', required: 2 },
        { role: 'Pro', required: 2 },
        { role: 'Support', required: 1 },
      ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          Select Preferred Role for {sportConfig?.sport || sportName}
        </label>
        <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
          {sportConfig ? `${sportConfig.total_players} players / team` : 'Dynamic Roster'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {roles.map((r, idx) => {
          const isSelected = selectedRole?.toLowerCase() === r.role.toLowerCase();
          const remaining = roleRemainingSpace[r.role] ?? r.required;
          const hasSpace = remaining > 0;

          return (
            <motion.div
              key={r.role || idx}
              whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => {
                if (!disabled) {
                  onSelectRole(r.role);
                }
              }}
              className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-primary/20 border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20'
                  : 'bg-card/70 border-white/10 hover:border-white/20 hover:bg-card/90'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-foreground/80'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{r.role}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Quota: {r.required} per team
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="text-primary flex items-center gap-1 text-xs font-semibold bg-primary/20 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selected
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      hasSpace
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    {hasSpace ? `${remaining} open` : 'Forming team'}
                  </span>
                )}
              </div>

              {/* Live Remaining Space Indicator */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Remaining Space:</span>
                <span className={hasSpace ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {hasSpace ? `${remaining} slot${remaining > 1 ? 's' : ''} available` : 'Next team opening'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
