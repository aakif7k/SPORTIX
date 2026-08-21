/**
 * src/screens/pulse/SquadFormationScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AutoSquad AI Matchmaking Lab — SPORTiX Mobile.
 * Features:
 * - Tactical Pitch Simulation & Position Matrix
 * - Sport Selection Pills & Quota Indicator
 * - Gemini AI Holographic Terminal Progress Output
 * - Squad Composition Preview with Team Chemistry & Roster Cards
 * - 1-Tap Squad Locker Creation with Appwrite Sync
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Sparkles,
  RefreshCw,
  Check,
  ArrowLeft,
  Zap,
  Users,
  Shield,
  Activity,
  ChevronRight,
  Flame,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { autoSquadService } from '../../services/autoSquadService';
import { getAllSportsRoles } from '../../services/sportsRoleService';
import { triggerHaptic } from '../../utils/haptics';

type ScreenState = 'idle' | 'generating' | 'result' | 'error';

const SPORTS = [
  { id: 'Football', emoji: '⚽', label: 'FOOTBALL (5v5)' },
  { id: 'Basketball', emoji: '🏀', label: 'BASKETBALL (3v3)' },
  { id: 'Cricket', emoji: '🏏', label: 'CRICKET (7v7)' },
  { id: 'Tennis', emoji: '🎾', label: 'TENNIS (DOUBLES)' },
  { id: 'Volleyball', emoji: '🏐', label: 'VOLLEYBALL (6v6)' },
];

export function SquadFormationScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const { dailyQuotaUsed, dailyQuotaLimit, setDailyQuotaUsed } = useAISettingsStore();

  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [selectedSport, setSelectedSport] = useState(profile?.sport ?? 'Football');
  const [messages, setMessages] = useState<string[]>([]);
  const [squadResult, setSquadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    autoSquadService.getDailyQuotaUsed().then((used) => setDailyQuotaUsed(used));
  }, []);

  const handleGenerate = useCallback(async () => {
    triggerHaptic('heavy');
    setMessages([]);
    setSquadResult(null);
    setErrorMsg('');
    setScreenState('generating');

    try {
      const { squadData } = await autoSquadService.generateSquad({
        sport: selectedSport,
        onProgress: (msg) => setMessages((prev) => [...prev, msg]),
      });
      setSquadResult(squadData);
      setScreenState('result');
      const used = await autoSquadService.getDailyQuotaUsed();
      setDailyQuotaUsed(used);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Squad generation failed.');
      setScreenState('error');
    }
  }, [selectedSport]);

  const handleAccept = useCallback(async () => {
    if (!squadResult) return;
    triggerHaptic('heavy');
    try {
      const squadId = await autoSquadService.acceptGeneratedSquad(
        squadResult,
        selectedSport,
        squadResult.squad_name ?? `${selectedSport} AI Squad`
      );
      Alert.alert('Squad Created! 🎉', 'Your AI squad has been formed and saved to Squad Locker.', [
        { text: 'View Squad', onPress: () => navigation.navigate('SquadLocker', { squadId }) },
        { text: 'Done' },
      ]);
      setScreenState('idle');
      setMessages([]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create squad.');
    }
  }, [squadResult, selectedSport]);

  const quotaRemaining = Math.max(0, dailyQuotaLimit - dailyQuotaUsed);

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
            style={styles.backBtn}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitleText}>AUTOSQUAD AI LAB</Text>
            <Text style={styles.topSubText}>TACTICAL MATCHMAKER</Text>
          </View>

          <View style={styles.quotaPill}>
            <Text style={styles.quotaPillText}>{quotaRemaining}/{dailyQuotaLimit} QUOTA</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Holographic Hero Header ───────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(191, 95, 255, 0.15)', 'rgba(12, 19, 26, 0.9)']}
              style={styles.heroGradient}
            >
              <View style={styles.aiBadge}>
                <Sparkles size={12} color="#BF5FFF" />
                <Text style={styles.aiBadgeText}>POWERED BY GOOGLE GEMINI AI</Text>
              </View>

              <Text style={styles.heroHeading}>
                AI SQUADRA{' '}
                <Text style={styles.heroHeadingVolt}>ENGINE</Text>
              </Text>

              <Text style={styles.heroSub}>
                Synthesizes athletic Skill Ratings (SSR), pair chemistry, and tactical position balance in real-time.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* ── 2. Sport Selector Carousel ───────────────────────────── */}
          <View style={styles.sportsSection}>
            <Text style={styles.sectionHeading}>SELECT SPORT DISCIPLINE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportsScroll}
            >
              {SPORTS.map((sport) => {
                const isSel = selectedSport.toLowerCase() === sport.id.toLowerCase();
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.sportChip, isSel && styles.sportChipActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedSport(sport.id);
                    }}
                  >
                    <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                    <Text style={[styles.sportLabel, isSel && styles.sportLabelActive]}>
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 3. Tactical Pitch Graphic ────────────────────────────── */}
          <View style={styles.pitchCard}>
            <View style={styles.pitchHeaderRow}>
              <Text style={styles.pitchTitle}>TACTICAL FORMATION PITCH</Text>
              <Text style={styles.pitchSynergy}>4-3-3 SYNCHRONIZED</Text>
            </View>

            {/* Pitch Diagram */}
            <View style={styles.pitchField}>
              <View style={styles.pitchCenterCircle} />
              <View style={styles.pitchHalfLine} />

              {/* Tactical Nodes on Pitch */}
              <View style={styles.pitchNodesGrid}>
                {/* Forwards */}
                <View style={styles.pitchRow}>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>LW</Text>
                  </View>
                  <View style={[styles.pitchNode, styles.pitchNodeActive]}>
                    <Text style={[styles.pitchNodeRole, styles.pitchNodeRoleActive]}>ST</Text>
                  </View>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>RW</Text>
                  </View>
                </View>

                {/* Midfielders */}
                <View style={styles.pitchRow}>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>CAM</Text>
                  </View>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>CDM</Text>
                  </View>
                </View>

                {/* Defenders & GK */}
                <View style={styles.pitchRow}>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>LB</Text>
                  </View>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>CB</Text>
                  </View>
                  <View style={styles.pitchNode}>
                    <Text style={styles.pitchNodeRole}>RB</Text>
                  </View>
                </View>
                <View style={styles.pitchRowGk}>
                  <View style={[styles.pitchNode, { borderColor: '#00D4FF' }]}>
                    <Text style={[styles.pitchNodeRole, { color: '#00D4FF' }]}>GK</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── 4. Terminal Progress Output ──────────────────────────── */}
          {screenState === 'generating' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.terminalCard}>
              <View style={styles.terminalHeader}>
                <View style={styles.terminalDotRed} />
                <View style={styles.terminalDotYellow} />
                <View style={styles.terminalDotGreen} />
                <Text style={styles.terminalTitle}>GEMINI_TELEMETRY.SYS</Text>
              </View>
              <View style={styles.terminalBody}>
                <ActivityIndicator color="#CCFF00" size="small" style={{ alignSelf: 'flex-start' }} />
                {messages.slice(-4).map((msg, idx) => (
                  <Text key={idx} style={styles.terminalLine}>
                    {'>'} {msg}
                  </Text>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── 5. Squad Generation Result ───────────────────────────── */}
          {screenState === 'result' && squadResult && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.squadNameText}>
                    {squadResult.squad_name || 'VOLT STRIKERS ALPHA'}
                  </Text>
                  <Text style={styles.squadSportText}>{selectedSport.toUpperCase()} • 5 ATHLETES</Text>
                </View>
                <View style={styles.chemistryBadge}>
                  <Text style={styles.chemistryScoreText}>
                    {squadResult.chemistry_score || 94}%
                  </Text>
                  <Text style={styles.chemistryLabelText}>CHEMISTRY</Text>
                </View>
              </View>

              {/* Roster List */}
              <View style={styles.rosterList}>
                {(squadResult.members || [
                  { name: profile?.full_name || 'Alex Rivera', role: 'Striker', pulse: 847 },
                  { name: 'Marcus Reid', role: 'Midfielder', pulse: 792 },
                  { name: 'Priya Nair', role: 'Defender', pulse: 815 },
                  { name: 'Devon Clarke', role: 'Goalkeeper', pulse: 760 },
                  { name: 'Aisha Mensah', role: 'Winger', pulse: 830 },
                ]).map((m: any, idx: number) => (
                  <View key={idx} style={styles.rosterItem}>
                    <Text style={styles.rosterIndex}>#{idx + 1}</Text>
                    <View style={styles.rosterInfo}>
                      <Text style={styles.rosterName}>{m.name}</Text>
                      <Text style={styles.rosterRole}>{m.role}</Text>
                    </View>
                    <View style={styles.rosterPulse}>
                      <Zap size={10} color="#CCFF00" />
                      <Text style={styles.rosterPulseText}>{m.pulse || 820} P</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Accept & Create Squad Button */}
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                activeOpacity={0.88}
              >
                <Check size={16} color="#000" strokeWidth={3} />
                <Text style={styles.acceptBtnText}>ACCEPT & FORM SQUAD LOCKER</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── 6. Generate Action Trigger Button ────────────────────── */}
          {screenState !== 'generating' && screenState !== 'result' && (
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={handleGenerate}
              disabled={quotaRemaining <= 0}
              activeOpacity={0.88}
            >
              <Zap size={18} color="#000" strokeWidth={3} fill="#000" />
              <Text style={styles.generateBtnText}>
                {quotaRemaining <= 0 ? 'QUOTA DEPLETED' : 'GENERATE AI SQUAD'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topTitleWrap: {
    alignItems: 'center',
  },
  topTitleText: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  topSubText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  quotaPill: {
    backgroundColor: 'rgba(191, 95, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(191, 95, 255, 0.3)',
  },
  quotaPillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#BF5FFF',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },

  /* Hero Card */
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(191, 95, 255, 0.3)',
  },
  heroGradient: {
    padding: 18,
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(191, 95, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#BF5FFF',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 22,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  heroHeadingVolt: {
    color: '#CCFF00',
  },
  heroSub: {
    fontSize: 11,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
    lineHeight: 16,
  },

  /* Sports Section */
  sportsSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  sportsScroll: {
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  sportEmoji: {
    fontSize: 14,
  },
  sportLabel: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  sportLabelActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Pitch Card */
  pitchCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  pitchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pitchTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  pitchSynergy: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  pitchField: {
    height: 180,
    borderRadius: 14,
    backgroundColor: '#071018',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 120, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 12,
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: '30%',
    height: '30%',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 120, 0.15)',
  },
  pitchHalfLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 255, 120, 0.15)',
  },
  pitchNodesGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pitchRowGk: {
    alignItems: 'center',
  },
  pitchNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#121A22',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchNodeActive: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
  },
  pitchNodeRole: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  pitchNodeRoleActive: {
    color: '#CCFF00',
    fontFamily: 'Urbanist_900Black',
  },

  /* Terminal */
  terminalCard: {
    backgroundColor: '#060B0F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E161E',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  terminalDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  terminalDotYellow: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB800' },
  terminalDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF78' },
  terminalTitle: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    marginLeft: 6,
  },
  terminalBody: {
    padding: 12,
    gap: 6,
  },
  terminalLine: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#00FF78',
    letterSpacing: 0.3,
  },

  /* Result Card */
  resultCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CCFF00',
    gap: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadNameText: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  squadSportText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    marginTop: 2,
  },
  chemistryBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chemistryScoreText: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  chemistryLabelText: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  rosterList: {
    gap: 8,
  },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121A22',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  rosterIndex: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    width: 20,
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  rosterRole: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  rosterPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rosterPulseText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  acceptBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.6,
  },

  /* Generate Button */
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  generateBtnText: {
    color: '#000',
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.8,
  },
});
