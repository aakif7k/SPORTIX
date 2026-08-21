/**
 * src/screens/pulse/DailyRewardScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Cyber Reward Vault & Daily Missions — SPORTiX Mobile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  Gift,
  CheckCircle,
  Coins,
  Flame,
  Zap,
  Sparkles,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { pulseService } from '../../services/pulseService';
import { gamificationService } from '../../services/gamificationService';
import { triggerHaptic } from '../../utils/haptics';

const MULTIPLIERS = ['1.0x', '1.2x', '1.4x', '1.6x', '2.0x', '2.5x', '🔥 3.0x'];

export function DailyRewardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const { missions, setMissions, streakDays, setStreakDays } = useGamificationStore();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationService
      .getMyMissions()
      .then(setMissions)
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = async () => {
    triggerHaptic('heavy');
    setClaiming(true);
    try {
      const result = await pulseService.claimDailyReward();
      if (result.alreadyClaimed) {
        Alert.alert('Already Claimed!', 'Your daily crate has already been claimed today. Return tomorrow for your next reward!');
      } else {
        setClaimed(true);
        setCoinsEarned(result.coins || 150);
        setStreakDays(result.streak || (streakDays + 1));
        updateProfile({ coins_balance: result.coins, login_streak: result.streak });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not claim reward.');
    } finally {
      setClaiming(false);
    }
  };

  const currentStreak = streakDays || 5;

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top Header */}
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
            <Text style={styles.topTitleText}>DAILY REWARD VAULT</Text>
            <Text style={styles.topSubText}>CLAIM LOOT CRATES</Text>
          </View>

          <View style={styles.flamePill}>
            <Flame size={12} color="#FF6B00" />
            <Text style={styles.flamePillText}>{currentStreak}D STREAK</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Mystery Crate Hero Card ───────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.mysteryCard}>
            <LinearGradient
              colors={['rgba(255, 184, 0, 0.15)', 'rgba(12, 19, 26, 0.9)']}
              style={styles.mysteryGradient}
            >
              <View style={styles.crateIconCircle}>
                {claimed ? (
                  <CheckCircle size={44} color="#00FF78" />
                ) : (
                  <Gift size={44} color="#FFB800" />
                )}
              </View>

              <Text style={styles.crateHeading}>
                {claimed ? 'CRATE UNLOCKED!' : 'DAILY MYSTERY CRATE'}
              </Text>

              <Text style={styles.crateSub}>
                {claimed
                  ? `+${coinsEarned} Coins & +25 Pulse Points added to your wallet!`
                  : `Open today's supply drop for bonus Pulse Coins and XP multipliers.`}
              </Text>

              {!claimed && (
                <TouchableOpacity
                  style={styles.claimCrateBtn}
                  onPress={handleClaim}
                  disabled={claiming}
                  activeOpacity={0.88}
                >
                  {claiming ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Sparkles size={16} color="#000" />
                      <Text style={styles.claimCrateBtnText}>CLAIM DAILY LOOT</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 2. 7-Day Streak Multiplier Matrix ────────────────────── */}
          <View style={styles.streakMatrixCard}>
            <View style={styles.matrixHeaderRow}>
              <Text style={styles.matrixHeading}>7-DAY STREAK PROGRESSION</Text>
              <Text style={styles.matrixMultiplierBadge}>ACTIVE: 2.0x</Text>
            </View>

            <View style={styles.multiplierGrid}>
              {MULTIPLIERS.map((mult, idx) => {
                const isClaimed = idx < currentStreak;
                const isToday = idx === currentStreak - 1;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.multNode,
                      isClaimed && styles.multNodeClaimed,
                      isToday && styles.multNodeToday,
                    ]}
                  >
                    <Text style={styles.multDayLabel}>DAY {idx + 1}</Text>
                    <Text
                      style={[
                        styles.multVal,
                        isClaimed && { color: '#FFB800' },
                      ]}
                    >
                      {mult}
                    </Text>
                    {isClaimed ? (
                      <Check size={12} color="#00FF78" />
                    ) : (
                      <Coins size={12} color="#64748B" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── 3. Daily Tactical Missions List ──────────────────────── */}
          <View style={styles.missionsCard}>
            <View style={styles.matrixHeaderRow}>
              <Text style={styles.matrixHeading}>DAILY TACTICAL MISSIONS</Text>
              <Text style={styles.matrixMultiplierBadge}>RESETS IN 6H</Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#CCFF00" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.missionsList}>
                {(missions.length > 0
                  ? missions
                  : [
                      {
                        $id: 'm1',
                        mission: { title: 'Win 1 Clash in Football', reward_coins: 100 },
                        completed: true,
                      },
                      {
                        $id: 'm2',
                        mission: { title: 'Generate an AI AutoSquad Lineup', reward_coins: 50 },
                        completed: false,
                      },
                      {
                        $id: 'm3',
                        mission: { title: 'Cheer 3 Athletes in Hypezone Feed', reward_coins: 40 },
                        completed: false,
                      },
                      {
                        $id: 'm4',
                        mission: { title: 'Achieve 85%+ Squad Chemistry', reward_coins: 120 },
                        completed: false,
                      },
                    ]
                ).map((m: any) => (
                  <View key={m.$id} style={styles.missionRow}>
                    <View style={styles.missionLeft}>
                      <View
                        style={[
                          styles.missionCheckCircle,
                          m.completed && styles.missionCheckCircleDone,
                        ]}
                      >
                        {m.completed && <Check size={12} color="#000" strokeWidth={3} />}
                      </View>
                      <Text style={styles.missionTitle}>
                        {m.mission?.title || 'Tactical Mission'}
                      </Text>
                    </View>

                    <View style={styles.rewardChip}>
                      <Text style={styles.rewardChipText}>
                        +{m.mission?.reward_coins ?? 50} 🪙
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
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
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  flamePillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },

  /* Mystery Crate */
  mysteryCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  mysteryGradient: {
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  crateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  crateHeading: {
    fontSize: 20,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  crateSub: {
    fontSize: 11,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  claimCrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 6,
  },
  claimCrateBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.6,
  },

  /* Streak Matrix */
  streakMatrixCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixHeading: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.6,
  },
  matrixMultiplierBadge: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  multiplierGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  multNode: {
    width: 44,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#121A22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  multNodeClaimed: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
  },
  multNodeToday: {
    borderColor: '#CCFF00',
  },
  multDayLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  multVal: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },

  /* Missions */
  missionsCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  missionsList: {
    gap: 10,
  },
  missionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121A22',
    borderRadius: 14,
    padding: 12,
  },
  missionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  missionCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCheckCircleDone: {
    backgroundColor: '#00FF78',
    borderColor: '#00FF78',
  },
  missionTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFF',
    flex: 1,
  },
  rewardChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardChipText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFD700',
  },
});
