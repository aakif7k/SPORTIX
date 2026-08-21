/**
 * src/screens/auth/OnboardingIntroScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3-Page Cinematic Onboarding Experience for SPORTiX Mobile.
 * Inspired by: Nike × Strava × Discord × Gaming × Future Sports Technology.
 *
 * Slides:
 * 1. YOUR SPORTS IDENTITY — "BUILD YOUR ATHLETE IDENTITY"
 * 2. FIND YOUR CREW       — "FIND YOUR PERFECT CREW"
 * 3. PLAY. PROGRESS. RISE — "YOUR SPORTS JOURNEY, GAMIFIED"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Zap,
  Shield,
  Users,
  Trophy,
  Flame,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Activity,
  ArrowRight,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '01',
    category: 'DIGITAL ATHLETE DNA',
    headline: 'BUILD YOUR ATHLETE IDENTITY',
    subtext:
      'SPORTiX creates your verified digital sports passport. Track athletic telemetry, biometric radar, and official SSR ratings across every competition.',
    tag: '⚡ VERIFIED PASSPORT',
    accentColor: '#CCFF00',
  },
  {
    id: '02',
    category: 'AUTOSQUAD AI MATCHMAKING',
    headline: 'FIND YOUR PERFECT CREW',
    subtext:
      'AutoSquad AI matches you with compatible teammates based on sport discipline, role synergy, proximity, and competitive tier.',
    tag: '🎯 94% CHEMISTRY MATCH',
    accentColor: '#00D4FF',
  },
  {
    id: '03',
    category: 'GAMIFIED ATHLETIC PROGRESSION',
    headline: 'YOUR SPORTS JOURNEY, GAMIFIED',
    subtext:
      'Compete in local clashes, earn Pulse points, level up your DNA score, unlock milestone rewards, and climb global leaderboards.',
    tag: '👑 LEVEL 24 · STRIKER ELITE',
    accentColor: '#FF6B00',
  },
];

export function OnboardingIntroScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = SLIDES[currentSlide];

  const handleNext = () => {
    triggerHaptic('medium');
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      // Final slide CTA -> navigate to Login / Signup terminal
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    triggerHaptic('selection');
    navigation.navigate('Login');
  };

  return (
    <LinearGradient colors={['#000000', '#05070A', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.container}>
        {/* Top App Bar with Skip */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Zap size={14} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandText}>SPORTIX</Text>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>SKIP</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Animated Visual Area */}
        <View style={styles.visualContainer}>
          {currentSlide === 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.slideCard}>
              <View style={styles.cardHeader}>
                <View style={styles.ssrBadge}>
                  <Zap size={10} color="#CCFF00" fill="#CCFF00" />
                  <Text style={styles.ssrBadgeText}>SSR: 9.4 PROVISIONAL</Text>
                </View>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>ELITE STRIKER</Text>
                </View>
              </View>

              {/* Holographic Radar Simulation */}
              <View style={styles.radarVisualWrap}>
                <View style={styles.radarRingOuter} />
                <View style={styles.radarRingMid} />
                <View style={styles.radarRingCore}>
                  <Zap size={24} color="#CCFF00" fill="#CCFF00" />
                </View>

                {/* Satellite Stat Nodes */}
                <View style={[styles.statSatellite, { top: 10, alignSelf: 'center' }]}>
                  <Text style={styles.satelliteVal}>94</Text>
                  <Text style={styles.satelliteLabel}>PACE</Text>
                </View>
                <View style={[styles.statSatellite, { bottom: 10, alignSelf: 'center' }]}>
                  <Text style={styles.satelliteVal}>91</Text>
                  <Text style={styles.satelliteLabel}>TACTICS</Text>
                </View>
                <View style={[styles.statSatellite, { left: 10, top: '40%' }]}>
                  <Text style={styles.satelliteVal}>88</Text>
                  <Text style={styles.satelliteLabel}>DEFENSE</Text>
                </View>
                <View style={[styles.statSatellite, { right: 10, top: '40%' }]}>
                  <Text style={styles.satelliteVal}>96</Text>
                  <Text style={styles.satelliteLabel}>STAMINA</Text>
                </View>
              </View>

              <View style={styles.athletePassportFoot}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                  }}
                  style={styles.athleteThumb}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.athleteName}>ALEX RIVERA ✓</Text>
                  <Text style={styles.athleteSport}>Football · Forward · London, UK</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={16} color="#000" fill="#CCFF00" strokeWidth={2.5} />
                </View>
              </View>
            </Animated.View>
          )}

          {currentSlide === 1 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.slideCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.ssrBadge, { borderColor: 'rgba(0, 212, 255, 0.4)' }]}>
                  <Users size={10} color="#00D4FF" />
                  <Text style={[styles.ssrBadgeText, { color: '#00D4FF' }]}>AUTOSQUAD ACTIVE</Text>
                </View>
                <View style={[styles.tierPill, { backgroundColor: 'rgba(0, 212, 255, 0.12)' }]}>
                  <Text style={[styles.tierPillText, { color: '#00D4FF' }]}>5v5 CLASH SYNERGY</Text>
                </View>
              </View>

              {/* Squad Nodes Network */}
              <View style={styles.squadNodesWrap}>
                <View style={styles.squadConnectionLine} />
                <View style={styles.squadConnectionLineVert} />

                {/* Team Captain Center */}
                <View style={styles.captainNode}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                    }}
                    style={styles.captainNodeImg}
                  />
                  <View style={styles.captainCrown}>
                    <Text style={{ fontSize: 9 }}>👑</Text>
                  </View>
                </View>

                {/* Teammate 1 */}
                <View style={[styles.teammateNode, { top: 15, left: 20 }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
                    }}
                    style={styles.nodeImg}
                  />
                </View>

                {/* Teammate 2 */}
                <View style={[styles.teammateNode, { top: 15, right: 20 }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
                    }}
                    style={styles.nodeImg}
                  />
                </View>

                {/* Teammate 3 */}
                <View style={[styles.teammateNode, { bottom: 15, left: 20 }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
                    }}
                    style={styles.nodeImg}
                  />
                </View>

                {/* Teammate 4 */}
                <View style={[styles.teammateNode, { bottom: 15, right: 20 }]}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
                    }}
                    style={styles.nodeImg}
                  />
                </View>
              </View>

              <View style={styles.squadFooterMetrics}>
                <View style={styles.squadMetric}>
                  <Text style={styles.squadMetricLabel}>CHEMISTRY</Text>
                  <Text style={styles.squadMetricValVolt}>96%</Text>
                </View>
                <View style={styles.squadMetric}>
                  <Text style={styles.squadMetricLabel}>AVG DISTANCE</Text>
                  <Text style={styles.squadMetricValWhite}>2.4 km</Text>
                </View>
                <View style={styles.squadMetric}>
                  <Text style={styles.squadMetricLabel}>MATCH READY</Text>
                  <Text style={styles.squadMetricValCyan}>✓ Confirmed</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {currentSlide === 2 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.slideCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.ssrBadge, { borderColor: 'rgba(255, 107, 0, 0.4)' }]}>
                  <Flame size={10} color="#FF6B00" />
                  <Text style={[styles.ssrBadgeText, { color: '#FF6B00' }]}>7-DAY STREAK (2x XP)</Text>
                </View>
                <View style={[styles.tierPill, { backgroundColor: 'rgba(255, 107, 0, 0.12)' }]}>
                  <Text style={[styles.tierPillText, { color: '#FF6B00' }]}>LEVEL 24</Text>
                </View>
              </View>

              {/* Pulse Gauge & Level Progression */}
              <View style={styles.progressionVisualWrap}>
                <View style={styles.pulseDialCircle}>
                  <Text style={styles.pulseScoreNum}>850</Text>
                  <Text style={styles.pulseScoreLabel}>PULSE PTS</Text>
                  <View style={styles.pulseVoltSpark}>
                    <Zap size={14} color="#000" fill="#CCFF00" />
                  </View>
                </View>

                {/* Milestone Roadmap */}
                <View style={styles.roadmapRow}>
                  <View style={styles.milestoneBoxActive}>
                    <Text style={styles.milestoneTitle}>LVL 24</Text>
                    <Text style={styles.milestoneSub}>ROOKIE</Text>
                  </View>
                  <View style={styles.milestoneLine} />
                  <View style={styles.milestoneBoxFuture}>
                    <Text style={styles.milestoneTitleMuted}>LVL 25</Text>
                    <Text style={styles.milestoneSubMuted}>PRO (+100P)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressionFooter}>
                <Text style={styles.progressionDropTitle}>🎁 NEXT UNLOCK: PRO TOURNAMENT PASS</Text>
                <Text style={styles.progressionDropSub}>
                  Earn 150 more Pulse in weekly clashes to claim
                </Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Text Content & Carousel Indicators */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.textContentSection}>
          {/* Pagination Capsule Indicators */}
          <View style={styles.paginationRow}>
            {SLIDES.map((s, idx) => {
              const isSel = idx === currentSlide;
              return (
                <View
                  key={s.id}
                  style={[
                    styles.pageCapsule,
                    isSel && styles.pageCapsuleActive,
                    isSel && { backgroundColor: slide.accentColor },
                  ]}
                />
              );
            })}
          </View>

          <Text style={[styles.slideCategory, { color: slide.accentColor }]}>
            {slide.category}
          </Text>
          <Text style={styles.slideHeadline}>{slide.headline}</Text>
          <Text style={styles.slideSubtext}>{slide.subtext}</Text>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: slide.accentColor }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionBtnText}>
              {currentSlide === SLIDES.length - 1 ? 'ENTER SPORTIX 🚀' : 'NEXT STEP'}
            </Text>
            <ArrowRight size={18} color="#000" strokeWidth={2.8} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 1,
  },

  /* Visual Container */
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  slideCard: {
    width: width - 40,
    backgroundColor: '#080808',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ssrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  ssrBadgeText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  tierPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierPillText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },

  /* Radar Visual */
  radarVisualWrap: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderStyle: 'dashed',
  },
  radarRingMid: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
  },
  radarRingCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFF00',
  },
  statSatellite: {
    position: 'absolute',
    backgroundColor: '#0E0E0E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  satelliteVal: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  satelliteLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },

  athletePassportFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  athleteThumb: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  athleteName: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  athleteSport: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
    marginTop: 1,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Squad Nodes Wrap */
  squadNodesWrap: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  squadConnectionLine: {
    position: 'absolute',
    width: '75%',
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
  },
  squadConnectionLineVert: {
    position: 'absolute',
    height: '75%',
    width: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
  },
  captainNode: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00D4FF',
    overflow: 'hidden',
  },
  captainNodeImg: {
    width: '100%',
    height: '100%',
  },
  captainCrown: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 1,
  },
  teammateNode: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  nodeImg: {
    width: '100%',
    height: '100%',
  },
  squadFooterMetrics: {
    flexDirection: 'row',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  squadMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  squadMetricLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  squadMetricValVolt: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  squadMetricValWhite: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  squadMetricValCyan: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#00D4FF',
  },

  /* Progression Wrap */
  progressionVisualWrap: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  pulseDialCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0E0E0E',
    borderWidth: 3,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    position: 'relative',
  },
  pulseScoreNum: {
    fontSize: 22,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  pulseScoreLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FF6B00',
  },
  pulseVoltSpark: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 2,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '90%',
  },
  milestoneBoxActive: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  milestoneTitle: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },
  milestoneSub: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  milestoneLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  milestoneBoxFuture: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  milestoneTitleMuted: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
  },
  milestoneSubMuted: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  progressionFooter: {
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  progressionDropTitle: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },
  progressionDropSub: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Text Content Section */
  textContentSection: {
    gap: 8,
    paddingBottom: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  pageCapsule: {
    width: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  pageCapsuleActive: {
    width: 32,
  },
  slideCategory: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 1.2,
  },
  slideHeadline: {
    fontSize: 24,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  slideSubtext: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 18,
  },

  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },
});
