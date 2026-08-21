/**
 * src/screens/squads/SquadSettingsScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { squadService } from '../../services/squadService';
import { Squad, SquadMember } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export function SquadSettingsScreen({ route, navigation }: any) {
  const { squadId } = route.params;
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);

  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      squadService.getSquad(squadId),
      squadService.getMembers(squadId),
    ]).then(([s, m]) => {
      setSquad(s);
      setMembers(m);
    }).finally(() => setLoading(false));
  }, [squadId]);

  const handleTransferCaptain = (newCaptainId: string, memberName: string) => {
    Alert.alert(
      'Transfer Captaincy',
      `Are you sure you want to pass captaincy to ${memberName}? You will lose squad admin controls.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await squadService.transferCaptaincy(squadId, newCaptainId);
              Alert.alert('Transferred', 'Captaincy updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to transfer captaincy.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={[styles.loader, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.volt} size="large" /></View>;

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Squad Management</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>
              TRANSFER CAPTAINCY
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
              Select a roster member to designate as the new captain.
            </Text>

            <View style={styles.memberList}>
              {members.filter(m => m.user_id !== profile?.$id).map(m => (
                <TouchableOpacity
                  key={m.$id}
                  disabled={saving}
                  onPress={() => handleTransferCaptain(m.user_id, m.profile?.full_name || 'Member')}
                  style={[styles.memberRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>
                      {m.profile?.full_name || 'Player'}
                    </Text>
                    <Text style={[styles.memberPos, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>
                      {m.position || 'Player'}
                    </Text>
                  </View>
                  <View style={[styles.crownBtn, { backgroundColor: colors.voltDim }]}>
                    <Crown size={16} color={colors.volt} />
                  </View>
                </TouchableOpacity>
              ))}

              {members.filter(m => m.user_id !== profile?.$id).length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
                  No other members in roster to transfer to.
                </Text>
              )}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1 },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:     { fontSize: 17 },
  scroll:          { padding: 16, gap: 16, paddingBottom: 40 },
  card:            { padding: 16, gap: 12 },
  sectionTitle:    { fontSize: 13, letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18 },
  memberList:      { marginTop: 8 },
  memberRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  memberInfo:      { gap: 2 },
  memberName:      { fontSize: 15 },
  memberPos:       { fontSize: 13 },
  crownBtn:        { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText:       { textAlign: 'center', paddingVertical: 16, fontSize: 13 },
});
