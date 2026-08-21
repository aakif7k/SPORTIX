/**
 * src/screens/squads/SquadMatchHistoryScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX ClashHub Match History — 1:1 Parity with Web App & Screenshot 4.
 * Features:
 * - Top Telemetry Header with "PERFORMANCE ANALYTICS" Action Button
 * - 4-Box Telemetry Metric Grid (Matches, Pulse Earned, Win Rate, SSR Rating)
 * - Sport Filter Horizontal Chips (All Sports, Football, Basketball, Cricket, Running)
 * - Outcome Filter (All, Wins, Losses, Draws)
 * - Pending Match Report Card (with Complete Report Action)
 * - Logged Matches with Sport Badge, Event Name, Outcome (WIN/LOSS/DRAW),
 *   Dynamic Performance Stats Strip, Pulse/SSR Delta, and Teammate Validation Pill
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  Trophy,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const SPORTS = [
  { id: 'all', label: 'ALL SPORTS', emoji: '🔥' },
  { id: 'football', label: 'FOOTBALL', emoji: '⚽' },
  { id: 'basketball', label: 'BASKETBALL', emoji: '🏀' },
  { id: 'cricket', label: 'CRICKET', emoji: '🏏' },
  { id: 'running', label: 'RUNNING', emoji: '🏃' },
];

const OUTCOMES = ['ALL', 'WINS', 'LOSSES', 'DRAWS'];

interface MatchCardData {
  id: string;
  sport: 'football' | 'basketball' | 'cricket' | 'running';
  sportLabel: string;
  eventName: string;
  hasCrown?: boolean;
  outcome: 'WIN' | 'LOSS' | 'DRAW';
  stats: Array<{ label: string; val: string | number }>;
  pulseDelta: number;
  ssrDelta: string;
  ssrPositive: boolean;
  validated: boolean;
  partialValidation?: boolean;
}

const MATCHES: MatchCardData[] = [
  {
    id: 'm1',
    sport: 'football',
    sportLabel: 'Football',
    eventName: 'Berlin 5v5 Championship',
    hasCrown: true,
    outcome: 'WIN',
    stats: [
      { label: 'Goals', val: 2 },
      { label: 'Assists', val: 1 },
      { label: 'Passes', val: 34 },
      { label: 'Rating', val: '8/10' },
    ],
    pulseDelta: 91,
    ssrDelta: '+0.4',
    ssrPositive: true,
    validated: true,
  },
  {
    id: 'm2',
    sport: 'basketball',
    sportLabel: 'Basketball',
    eventName: 'Urban Streetball Showdown',
    outcome: 'WIN',
    stats: [
      { label: 'Points', val: 22 },
      { label: 'Assists', val: 5 },
      { label: 'Rebounds', val: 8 },
      { label: 'Rating', val: '7/10' },
    ],
    pulseDelta: 74,
    ssrDelta: '+0.3',
    ssrPositive: true,
    validated: true,
  },
  {
    id: 'm3',
    sport: 'football',
    sportLabel: 'Football',
    eventName: 'Metropolitan Cup 2026',
    outcome: 'DRAW',
    stats: [
      { label: 'Goals', val: 1 },
      { label: 'Assists', val: 0 },
      { label: 'Passes', val: 28 },
      { label: 'Rating', val: '6/10' },
    ],
    pulseDelta: 42,
    ssrDelta: '+0.1',
    ssrPositive: true,
    validated: true,
  },
  {
    id: 'm4',
    sport: 'cricket',
    sportLabel: 'Cricket',
    eventName: 'Euro Cricket Open',
    outcome: 'WIN',
    stats: [
      { label: 'Runs', val: 67 },
      { label: 'Wickets', val: 2 },
      { label: 'Catches', val: 1 },
      { label: 'Rating', val: '7/10' },
    ],
    pulseDelta: 67,
    ssrDelta: '+0.3',
    ssrPositive: true,
    validated: false,
    partialValidation: true,
  },
  {
    id: 'm5',
    sport: 'football',
    sportLabel: 'Football',
    eventName: 'Alpha Cup Quarter-Final',
    outcome: 'LOSS',
    stats: [
      { label: 'Goals', val: 0 },
      { label: 'Assists', val: 1 },
      { label: 'Passes', val: 19 },
      { label: 'Rating', val: '5/10' },
    ],
    pulseDelta: 28,
    ssrDelta: '-0.1',
    ssrPositive: false,
    validated: true,
  },
];

export function SquadMatchHistoryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('ALL');

  const filteredMatches = MATCHES.filter((m) => {
    const sportMatch = selectedSport === 'all' || m.sport === selectedSport;
    const outcomeMatch =
      selectedOutcome === 'ALL' ||
      (selectedOutcome === 'WINS' && m.outcome === 'WIN') ||
      (selectedOutcome === 'LOSSES' && m.outcome === 'LOSS') ||
      (selectedOutcome === 'DRAWS' && m.outcome === 'DRAW');
    return sportMatch && outcomeMatch;
  });

  return (
    <LinearGradient colors={['#000000', '#020305', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Header Banner (Matches Screenshot 4) ─────────────────── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.headerHeroBanner}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  triggerHaptic('selection');
                  navigation.goBack();
                }}
              >
                <ArrowLeft size={18} color="#FFF" />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={styles.telemetryTag}>
                  <Activity size={10} color="#CCFF00" />
                  <Text style={styles.telemetryTagText}>CLASHHUB TELEMETRY</Text>
                </View>
                <Text style={styles.headerTitleText}>MATCH HISTORY</Text>
              </View>
            </View>

            {/* Performance Analytics Button */}
            <TouchableOpacity
              style={styles.perfAnalyticsBtn}
              onPress={() => {
                triggerHaptic('medium');
                Alert.alert('ClashHub Analytics 📈', 'Displaying live SSR rating delta and match telemetry.');
              }}
              activeOpacity={0.88}
            >
              <TrendingUp size={16} color="#000" strokeWidth={2.5} />
              <Text style={styles.perfAnalyticsBtnText}>PERFORMANCE ANALYTICS</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── 2. 4-Box Telemetry Metric Grid ──────────────────────────── */}
          <View style={styles.fourMetricsGrid}>
            <View style={styles.metricCard}>
              <Trophy size={16} color="#CCFF00" />
              <Text style={styles.metricBigNumber}>5</Text>
              <Text style={styles.metricLabel}>MATCHES</Text>
            </View>

            <View style={styles.metricCard}>
              <Zap size={16} color="#00D4FF" />
              <Text style={styles.metricBigNumber}>302</Text>
              <Text style={styles.metricLabel}>PULSE EARNED</Text>
            </View>

            <View style={styles.metricCard}>
              <Target size={16} color="#FF6B00" />
              <Text style={styles.metricBigNumber}>60%</Text>
              <Text style={styles.metricLabel}>WIN RATE</Text>
            </View>

            <View style={styles.metricCard}>
              <TrendingUp size={16} color="#BF5FFF" />
              <Text style={styles.metricBigNumber}>9.4</Text>
              <Text style={styles.metricLabel}>SSR RATING</Text>
            </View>
          </View>

          {/* ── 3. Sport Filters Carousel ────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsScroll}
          >
            {SPORTS.map((s) => {
              const isSel = selectedSport === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sportChipBtn, isSel && styles.sportChipBtnActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedSport(s.id);
                  }}
                >
                  <Text style={styles.sportChipEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportChipText, isSel && styles.sportChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── 4. Outcome Filter Bar ────────────────────────────────────── */}
          <View style={styles.outcomeBarRow}>
            <View style={styles.outcomeGroup}>
              {OUTCOMES.map((o) => {
                const isSel = selectedOutcome === o;
                return (
                  <TouchableOpacity
                    key={o}
                    style={[styles.outcomeBtn, isSel && styles.outcomeBtnActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedOutcome(o);
                    }}
                  >
                    <Text style={[styles.outcomeBtnText, isSel && styles.outcomeBtnTextActive]}>
                      {o}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.loggedMatchesCount}>{filteredMatches.length + 1} matches logged</Text>
          </View>

          {/* ── 5. Pending Report Banner ─────────────────────────────────── */}
          <View style={styles.pendingReportCard}>
            <View style={styles.pendingHeaderRow}>
              <View style={styles.pendingMatchLeft}>
                <Text style={styles.soccerBall}>⚽</Text>
                <Text style={styles.pendingSquadsTitle}>Iron Pulse FC vs Rapid XI</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>REPORT PENDING</Text>
              </View>
            </View>

            <Text style={styles.pendingDateText}>Thu, May 21</Text>

            <TouchableOpacity
              style={styles.completeReportRow}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('MatchReport', { matchId: 'pending-001' });
              }}
            >
              <Text style={styles.completeReportText}>Complete Report →</Text>
            </TouchableOpacity>
          </View>

          {/* ── 6. Logged Match Cards List ──────────────────────────────── */}
          <View style={styles.matchesList}>
            {filteredMatches.map((match) => {
              const isWin = match.outcome === 'WIN';
              const isDraw = match.outcome === 'DRAW';
              const isLoss = match.outcome === 'LOSS';

              return (
                <View key={match.id} style={styles.matchItemCard}>
                  {/* Card Top Row */}
                  <View style={styles.matchItemTopRow}>
                    <View style={styles.matchTitleLeft}>
                      <View style={styles.miniSportTag}>
                        <Text style={styles.miniSportTagText}>{match.sportLabel}</Text>
                      </View>
                      <Text style={styles.matchEventName} numberOfLines={1}>
                        {match.eventName} {match.hasCrown ? '👑' : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.outcomePill,
                        isWin && styles.outcomeWin,
                        isDraw && styles.outcomeDraw,
                        isLoss && styles.outcomeLoss,
                      ]}
                    >
                      <Text
                        style={[
                          styles.outcomePillText,
                          isWin && styles.outcomeWinText,
                          isDraw && styles.outcomeDrawText,
                          isLoss && styles.outcomeLossText,
                        ]}
                      >
                        {match.outcome}
                      </Text>
                    </View>
                  </View>

                  {/* Dynamic Stats Row */}
                  <View style={styles.statsStripRow}>
                    {match.stats.map((s, idx) => (
                      <View key={idx} style={styles.statStripItem}>
                        <Text style={styles.statStripText}>
                          {s.label}: <Text style={styles.statStripVal}>{s.val}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Card Bottom: Pulse Delta, SSR, and Verification */}
                  <View style={styles.matchItemBottomRow}>
                    <View style={styles.deltasLeft}>
                      <Text style={styles.pulseDeltaText}>+{match.pulseDelta} ⚡ Pulse</Text>
                      <Text
                        style={[
                          styles.ssrDeltaText,
                          { color: match.ssrPositive ? '#00D4FF' : '#FF4D4D' },
                        ]}
                      >
                        {match.ssrDelta} 📊 SSR
                      </Text>
                    </View>

                    <View style={styles.validationRight}>
                      {match.validated ? (
                        <View style={styles.validatedPill}>
                          <CheckCircle2 size={11} color="#00FF78" />
                          <Text style={styles.validatedText}>Validated by teammates</Text>
                        </View>
                      ) : (
                        <View style={styles.partiallyValidatedPill}>
                          <Clock size={11} color="#FFB800" />
                          <Text style={styles.partiallyValidatedText}>Partially validated</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  /* Header Hero Banner */
  headerHeroBanner: {
    backgroundColor: '#0C0B05',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryTagText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  perfAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  perfAnalyticsBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },

  /* 4-Box Telemetry Metric Grid */
  fourMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#080808',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 3,
  },
  metricBigNumber: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  metricLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  /* Sports Scroll */
  sportsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  sportChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#080808',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportChipBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  sportChipEmoji: {
    fontSize: 12,
  },
  sportChipText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  sportChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Outcome Bar */
  outcomeBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outcomeGroup: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  outcomeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  outcomeBtnActive: {
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  outcomeBtnText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  outcomeBtnTextActive: {
    color: '#FFF',
    fontFamily: 'Urbanist_900Black',
  },
  loggedMatchesCount: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },

  /* Pending Report Card */
  pendingReportCard: {
    backgroundColor: '#080808',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    gap: 8,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingMatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  soccerBall: {
    fontSize: 14,
  },
  pendingSquadsTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#FFB800',
  },
  pendingDateText: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  completeReportRow: {
    paddingTop: 4,
  },
  completeReportText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFB800',
  },

  /* Match Cards List */
  matchesList: {
    gap: 12,
  },
  matchItemCard: {
    backgroundColor: '#080808',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  matchItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  miniSportTag: {
    backgroundColor: '#0E0E0E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniSportTagText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  matchEventName: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
    flex: 1,
  },
  outcomePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  outcomeWin: {
    backgroundColor: 'rgba(0, 255, 120, 0.1)',
    borderColor: 'rgba(0, 255, 120, 0.3)',
  },
  outcomeWinText: {
    color: '#00FF78',
  },
  outcomeDraw: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  outcomeDrawText: {
    color: '#FFB800',
  },
  outcomeLoss: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  outcomeLossText: {
    color: '#FF4D4D',
  },
  outcomePillText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
  },

  /* Stats Strip Row */
  statsStripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statStripItem: {
    backgroundColor: '#0E0E0E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  statStripText: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },
  statStripVal: {
    color: '#FFF',
    fontFamily: 'Urbanist_800ExtraBold',
  },

  /* Card Bottom */
  matchItemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  deltasLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDeltaText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  ssrDeltaText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  validationRight: {},
  validatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validatedText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#00FF78',
  },
  partiallyValidatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partiallyValidatedText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFB800',
  },
});
