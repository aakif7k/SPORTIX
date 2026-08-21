/**
 * src/screens/matches/MatchValidationScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, X, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { matchService } from '../../services/matchService';
import { PlayerStat } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';

export function MatchValidationScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [validations, setValidations] = useState<PlayerStat[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    matchService.getPendingValidations()
      .then(setValidations)
      .finally(() => setLoading(false));
  }, []);

  const handleValidate = async (statId: string, approved: boolean) => {
    try {
      await matchService.submitValidation(statId, approved);
      setValidations(prev => prev.filter(v => v.$id !== statId));
      Alert.alert(approved ? 'Validated!' : 'Contested', approved ? 'Stat confirmed.' : 'Validation contested.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed.');
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Stat Validations</Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.volt} size="large" /></View>
        ) : (
          <FlatList
            data={validations}
            keyExtractor={v => v.$id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState icon="🛡️" title="No Pending Validations" subtitle="You have no reported opponent stats to review right now." />
            }
            renderItem={({ item }) => (
              <GlassCard style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.playerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>
                    Reported Stat Review
                  </Text>
                  <Text style={[styles.statDetail, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
                    Goals: {item.goals} | Assists: {item.assists} | Rating: {item.rating}
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    onPress={() => handleValidate(item.$id, false)}
                    style={[styles.actionBtn, { borderColor: colors.danger, backgroundColor: colors.dangerDim }]}
                  >
                    <X size={18} color={colors.danger} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleValidate(item.$id, true)}
                    style={[styles.actionBtn, { borderColor: '#00FF78', backgroundColor: 'rgba(0,255,120,0.15)' }]}
                  >
                    <Check size={18} color="#00FF78" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17 },
  list:        { padding: 16, gap: 12, paddingBottom: 40 },
  card:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardInfo:    { flex: 1, gap: 4 },
  playerTitle: { fontSize: 15 },
  statDetail:  { fontSize: 13 },
  btnRow:      { flexDirection: 'row', gap: 10 },
  actionBtn:   { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
