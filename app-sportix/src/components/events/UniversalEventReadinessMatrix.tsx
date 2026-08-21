/**
 * UniversalEventReadinessMatrix.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Native SPORTiX Universal Event Readiness Matrix.
 * Displays real-time event readiness, capacity, role shortages, and AutoSquad Lab launcher.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { getEventReadiness, type EventReadinessData } from '../../services/eventReadinessService';
import { useAuthStore } from '../../store/authStore';
import { Shield, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  eventId: string;
  sportName: string;
  maxCapacity?: number;
  onOpenAutoSquad?: () => void;
}

export const UniversalEventReadinessMatrix: React.FC<Props> = ({
  eventId,
  sportName,
  maxCapacity = 32,
  onOpenAutoSquad,
}) => {
  const profile = useAuthStore((state) => state.profile);
  const [data, setData] = useState<EventReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getEventReadiness(eventId, profile?.$id).then((res) => {
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [eventId, profile?.$id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#CCFF00" size="small" />
        <Text style={styles.loadingText}>CALCULATING READINESS MATRIX...</Text>
      </View>
    );
  }

  const registered = data?.eligible_count || 0;
  const capacity = data?.max_participants || maxCapacity;
  const progressPct = Math.min(100, Math.round((registered / Math.max(1, capacity)) * 100));
  const readinessPct = data?.allocation?.overall_readiness_pct || 0;
  const completedTeams = data?.allocation?.completed_teams_count || 0;
  const partialTeams = data?.allocation?.partial_teams_count || 0;
  const missingRoles = data?.allocation?.missing_roles_summary || [];
  const roleRemaining = data?.allocation?.role_remaining_space || {};

  return (
    <View style={styles.wrapper}>
      <GlassCard style={[styles.card, { borderColor: 'rgba(204, 255, 0, 0.25)' }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Shield size={18} color="#CCFF00" />
            <Text style={styles.title}>EVENT READINESS MATRIX</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{sportName.toUpperCase()}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>CLASH CAPACITY</Text>
            <Text style={styles.progressValue}>
              {registered} / {capacity} Athletes ({progressPct}%)
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{completedTeams}</Text>
            <Text style={styles.metricLabel}>FULL SQUADS</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{partialTeams}</Text>
            <Text style={styles.metricLabel}>FORMING</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#CCFF00' }]}>{readinessPct}%</Text>
            <Text style={styles.metricLabel}>READINESS</Text>
          </View>
        </View>

        {/* Role Space Pills */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionHeading}>ROLE AVAILABILITY (OPEN SLOTS)</Text>
          <View style={styles.rolesGrid}>
            {Object.entries(roleRemaining).map(([role, remaining]) => (
              <View key={role} style={styles.rolePill}>
                <Text style={styles.roleName} numberOfLines={1}>
                  {role}
                </Text>
                <Text style={[styles.roleCount, remaining > 0 ? styles.roleCountOpen : styles.roleCountFull]}>
                  {remaining > 0 ? `${remaining} Open` : 'Full'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shortages Alert */}
        {missingRoles.length > 0 && (
          <View style={styles.shortageCard}>
            <AlertTriangle size={14} color="#FFB800" />
            <Text style={styles.shortageText}>
              Needed for active teams:{' '}
              {missingRoles.slice(0, 3).map((m) => `${m.needed_count} ${m.role_name}`).join(', ')}
            </Text>
          </View>
        )}

        {/* Primary AutoSquad Lab CTA Button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            triggerHaptic('heavy');
            onOpenAutoSquad?.();
          }}
          activeOpacity={0.85}
        >
          <View style={styles.ctaLeft}>
            <View style={styles.ctaIconWrap}>
              <Sparkles size={16} color="#000" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>⚡ AUTOSQUAD AI LAB</Text>
              <Text style={styles.ctaSubtitle}>Build or join optimized AI squads for this clash</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#000" />
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#0C131A',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121C26',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  rolesSection: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14202C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minWidth: '47%',
  },
  roleName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DDD',
    flex: 1,
    marginRight: 4,
  },
  roleCount: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleCountOpen: {
    color: '#00D4FF',
  },
  roleCountFull: {
    color: '#666',
  },
  shortageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
    marginBottom: 16,
  },
  shortageText: {
    fontSize: 11,
    color: '#FFB800',
    fontWeight: '600',
    flex: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ctaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  ctaSubtitle: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
    marginTop: 1,
  },
});
