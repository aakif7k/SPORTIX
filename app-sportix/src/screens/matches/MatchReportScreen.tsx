/**
 * src/screens/matches/MatchReportScreen.tsx
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { matchService } from '../../services/matchService';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export function MatchReportScreen({ route, navigation }: any) {
  const { squad1Id, sport } = route.params || {};
  const { colors } = useTheme();
  const profile = useAuthStore(state => state.profile);

  const [oppSquadId, setOppSquadId] = useState('');
  const [score1,     setScore1]     = useState('0');
  const [score2,     setScore2]     = useState('0');
  const [myGoals,    setMyGoals]    = useState('0');
  const [myAssists,  setMyAssists]  = useState('0');
  const [myRating,   setMyRating]   = useState('7.5');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2)) {
      Alert.alert('Invalid Scores', 'Please enter valid numbers for match scores.');
      return;
    }

    setSubmitting(true);
    try {
      const winnerId = s1 > s2 ? (squad1Id || profile?.$id || 'squad1') : s2 > s1 ? (oppSquadId || 'squad2') : 'draw';
      await matchService.submitMatchReport({
        squad1_id: squad1Id || profile?.$id || 'squad1',
        squad2_id: oppSquadId.trim() || 'opp_squad',
        score1: s1,
        score2: s2,
        winner_id: winnerId,
        sport: sport || profile?.sport || 'Football',
        stats: [
          {
            user_id: profile?.$id || 'me',
            goals: parseInt(myGoals, 10) || 0,
            assists: parseInt(myAssists, 10) || 0,
            rating: parseFloat(myRating) || 7.0,
          },
        ],
      });

      Alert.alert('Match Submitted! 🏅', 'Match recorded and sent to opponents for stat validation.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not record match report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.background]} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>Submit Match Report</Text>
          <View style={{ width: 22 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>MATCH RESULT</Text>

              <View style={styles.scoreRow}>
                <View style={styles.scoreBlock}>
                  <Text style={[styles.scoreLabel, { color: colors.textPrimary, fontFamily: 'Urbanist_600SemiBold' }]}>Our Score</Text>
                  <TextInput
                    style={[styles.scoreInput, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_800ExtraBold' }]}
                    value={score1}
                    onChangeText={setScore1}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={[styles.vsText, { color: colors.textMuted, fontFamily: 'Urbanist_700Bold' }]}>VS</Text>

                <View style={styles.scoreBlock}>
                  <Text style={[styles.scoreLabel, { color: colors.textPrimary, fontFamily: 'Urbanist_600SemiBold' }]}>Opponent</Text>
                  <TextInput
                    style={[styles.scoreInput, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_800ExtraBold' }]}
                    value={score2}
                    onChangeText={setScore2}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Opponent Squad ID / Tag (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
                  placeholder="e.g. Squad ID or rival team name"
                  placeholderTextColor={colors.textMuted}
                  value={oppSquadId}
                  onChangeText={setOppSquadId}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: 'Urbanist_700Bold' }]}>YOUR INDIVIDUAL PERFORMANCE</Text>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Goals / Pts</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_700Bold' }]}
                    value={myGoals}
                    onChangeText={setMyGoals}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Assists</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_700Bold' }]}
                    value={myAssists}
                    onChangeText={setMyAssists}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Self Rating</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_700Bold' }]}
                    value={myRating}
                    onChangeText={setMyRating}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </GlassCard>

            <NeonButton label="Record Match" onPress={handleSubmit} loading={submitting} fullWidth />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 17 },
  scroll:       { padding: 16, gap: 16, paddingBottom: 32 },
  card:         { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 12, letterSpacing: 0.5 },
  scoreRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 8 },
  scoreBlock:   { alignItems: 'center', gap: 6 },
  scoreLabel:   { fontSize: 13 },
  scoreInput:   { width: 64, height: 64, borderRadius: 16, borderWidth: 1, textAlign: 'center', fontSize: 28 },
  vsText:       { fontSize: 16 },
  field:        { gap: 6 },
  label:        { fontSize: 13 },
  input:        { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  statsRow:     { flexDirection: 'row', gap: 12 },
  statCol:      { flex: 1, gap: 6 },
});
