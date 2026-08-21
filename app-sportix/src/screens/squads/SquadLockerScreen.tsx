/**
 * src/screens/squads/SquadLockerScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Shield, Users, Trophy, Settings as SettingsIcon, History } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { squadService } from '../../services/squadService';
import { Squad, SquadMember } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export function SquadLockerScreen({ route, navigation }: any) {
  const squadId = route?.params?.squadId;
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);

  const [squad,   setSquad]   = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSquad = async () => {
      try {
        if (squadId) {
          const [s, m] = await Promise.all([
            squadService.getSquad(squadId),
            squadService.getMembers(squadId),
          ]);
          setSquad(s);
          setMembers(m);
        } else {
          const mySquads = await squadService.getMySquads();
          if (mySquads.length > 0) {
            const current = mySquads[0];
            setSquad(current);
            const m = await squadService.getMembers(current.$id);
            setMembers(m);
          }
        }
      } catch (err) {
        console.error('[SquadLocker] error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSquad();
  }, [squadId]);

  const isCaptain = squad && profile?.$id === squad.captain_id;

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.volt} size="large" />
      </View>
    );
  }

  if (!squad) {
    return (
      <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Squad Locker</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.emptyContainer}>
            <Shield size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>No Squad Joined</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
              Form a squad via AutoSquad or join a clash to get started.
            </Text>
            <NeonButton label="Open AutoSquad" onPress={() => navigation.navigate('AutoSquadTab')} style={{ marginTop: 16 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Squad Locker</Text>
          {isCaptain ? (
            <TouchableOpacity onPress={() => navigation.navigate('SquadSettings', { squadId: squad.$id })}>
              <SettingsIcon size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : <View style={{ width: 22 }} />}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Squad Badge / Title */}
          <GlassCard style={styles.bannerCard}>
            <View style={[styles.shieldWrap, { backgroundColor: colors.voltDim, borderColor: colors.volt }]}>
              <Shield size={36} color={colors.volt} />
            </View>
            <Text style={[styles.squadName, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
              {squad.name}
            </Text>
            <Text style={[styles.squadSport, { color: colors.volt, fontFamily: 'Urbanist_700Bold' }]}>
              {squad.sport.toUpperCase()} SQUAD
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>{squad.overall_rating || 78}</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>Overall</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.volt, fontFamily: 'Urbanist_800ExtraBold' }]}>{squad.chemistry_rating || 85}%</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>Chemistry</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metric}>
                <Text style={[styles.metricVal, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>{members.length}</Text>
                <Text style={[styles.metricLbl, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>Roster</Text>
              </View>
            </View>
          </GlassCard>

          {/* Quick Actions */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SquadMatchHistory', { squadId: squad.$id })}
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <History size={20} color={colors.volt} />
              <Text style={[styles.actionCardText, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Match Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('MatchReport', { squad1Id: squad.$id, sport: squad.sport })}
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Trophy size={20} color={colors.volt} />
              <Text style={[styles.actionCardText, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Report Match</Text>
            </TouchableOpacity>
          </View>

          {/* Active Roster */}
          <View style={styles.rosterSection}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>
              ACTIVE ROSTER ({members.length})
            </Text>

            {members.map((m, idx) => (
              <TouchableOpacity
                key={m.$id || idx}
                onPress={() => navigation.navigate('AthleteProfile', { userId: m.user_id })}
                style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {m.profile?.avatar_url ? (
                  <Image source={{ uri: m.profile.avatar_url }} style={styles.memberAvatar} />
                ) : (
                  <View style={[styles.memberAvatar, { backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: colors.textMuted, fontFamily: 'Urbanist_700Bold' }}>
                      {m.profile?.full_name?.charAt(0) || 'P'}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>
                    {m.profile?.full_name || 'Squad Member'}
                  </Text>
                  <Text style={[styles.memberRole, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>
                    {m.position || m.role || 'Player'}
                  </Text>
                </View>
                {m.user_id === squad.captain_id && (
                  <View style={[styles.captainBadge, { backgroundColor: colors.voltDim }]}>
                    <Text style={[styles.captainText, { color: colors.volt, fontFamily: 'Urbanist_800ExtraBold' }]}>C</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1 },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 17 },
  scroll:         { padding: 16, gap: 16, paddingBottom: 40 },
  bannerCard:     { alignItems: 'center', paddingVertical: 20, gap: 8 },
  shieldWrap:     { width: 64, height: 64, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  squadName:      { fontSize: 24, textAlign: 'center' },
  squadSport:     { fontSize: 12, letterSpacing: 1 },
  metricsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  metric:         { alignItems: 'center', gap: 2 },
  metricVal:      { fontSize: 20 },
  metricLbl:      { fontSize: 11 },
  metricDivider:  { width: 1, height: 24 },
  actionGrid:     { flexDirection: 'row', gap: 12 },
  actionCard:     { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8 },
  actionCardText: { fontSize: 14 },
  rosterSection:  { gap: 10 },
  sectionHeading: { fontSize: 12, letterSpacing: 0.5, marginBottom: 4 },
  memberCard:     { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  memberAvatar:   { width: 44, height: 44, borderRadius: 22 },
  memberInfo:     { flex: 1 },
  memberName:     { fontSize: 15 },
  memberRole:     { fontSize: 13, marginTop: 2 },
  captainBadge:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  captainText:    { fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle:     { fontSize: 20, marginTop: 12 },
  emptySubtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
