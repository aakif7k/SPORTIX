/**
 * src/screens/auth/WelcomeScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Futuristic Entry & Hero Landing Screen for SPORTiX Mobile.
 * Inspired by: Nike × Strava × Discord × Gaming × Future Sports Technology.
 *
 * Actions:
 * - "GET STARTED" → 3-Slide Onboarding Experience (OnboardingIntro)
 * - "SKIP"        → Login Terminal
 * - "Sign In"     → Login Terminal
 */

import React from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Zap,
  Shield,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Row with Skip Button */}
        <View style={styles.topNavRow}>
          <View style={styles.topBrand}>
            <View style={styles.brandLogoHex}>
              <Zap size={15} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandTitleText}>SPORTIX</Text>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              triggerHaptic('selection');
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.skipBtnText}>SKIP →</Text>
          </TouchableOpacity>
        </View>

        {/* Center Hero Visual Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroVisualSection}>
          <View style={styles.heroPassportCard}>
            <View style={styles.passportHeader}>
              <View style={styles.ssrBadge}>
                <Zap size={10} color="#CCFF00" fill="#CCFF00" />
                <Text style={styles.ssrBadgeText}>SSR: 9.4 PROVISIONAL</Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame size={10} color="#FF6B00" />
                <Text style={styles.streakBadgeText}>7D STREAK</Text>
              </View>
            </View>

            {/* Athlete Center Visual */}
            <View style={styles.athleteCenterWrap}>
              <View style={styles.avatarGlowRing}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                  }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
                <View style={styles.verifiedCheckBadge}>
                  <CheckCircle2 size={12} color="#000" strokeWidth={3} fill="#CCFF00" />
                </View>
              </View>

              <Text style={styles.athleteNameHero}>MUHAMMAD AAKIF ✓</Text>
              <Text style={styles.athleteMetaHero}>@aakif · Forward · New York, USA</Text>
            </View>

            {/* Telemetry Metric Pills */}
            <View style={styles.heroTelemetryGrid}>
              <View style={styles.telemetryBox}>
                <Text style={styles.telemetryLabel}>AUTOSQUAD</Text>
                <Text style={styles.telemetryVolt}>94% Match</Text>
              </View>
              <View style={styles.telemetryBox}>
                <Text style={styles.telemetryLabel}>PULSE LEVEL</Text>
                <Text style={styles.telemetryWhite}>Level 24</Text>
              </View>
              <View style={styles.telemetryBox}>
                <Text style={styles.telemetryLabel}>MATCH RECORD</Text>
                <Text style={styles.telemetryVolt}>18W · 2L</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Headline & Call To Actions */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.bottomSection}>
          <View style={styles.taglineBadge}>
            <Sparkles size={12} color="#CCFF00" />
            <Text style={styles.taglineBadgeText}>THE FUTURE OF ATHLETIC COMPETITION</Text>
          </View>

          <Text style={styles.headlineTitle}>
            UNLEASH YOUR <Text style={{ color: '#CCFF00' }}>ATHLETIC DNA</Text>
          </Text>

          <Text style={styles.headlineSubtitle}>
            The intelligent sports competition platform. Match with elite squads, compete in local clashes, and build your verified digital sports legacy.
          </Text>

          <View style={styles.actionButtonsWrap}>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => {
                triggerHaptic('heavy');
                navigation.navigate('OnboardingIntro');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.getStartedBtnText}>GET STARTED</Text>
              <ArrowRight size={18} color="#000" strokeWidth={2.8} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInLinkBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.signInLinkText}>
                Already have an account? <Text style={{ color: '#CCFF00', fontFamily: 'Urbanist_900Black' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoHex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 18,
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

  /* Hero Visual Card */
  heroVisualSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  heroPassportCard: {
    width: width - 40,
    backgroundColor: '#080808',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  passportHeader: {
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  streakBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },

  athleteCenterWrap: {
    alignItems: 'center',
    gap: 6,
  },
  avatarGlowRing: {
    position: 'relative',
    width: 86,
    height: 86,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CCFF00',
    padding: 2,
    backgroundColor: '#0E0E0E',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteNameHero: {
    fontSize: 17,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  athleteMetaHero: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },

  heroTelemetryGrid: {
    flexDirection: 'row',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  telemetryLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  telemetryVolt: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  telemetryWhite: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },

  /* Bottom Section */
  bottomSection: {
    gap: 8,
    paddingBottom: 4,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  taglineBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 1,
  },
  headlineTitle: {
    fontSize: 28,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    lineHeight: 32,
    letterSpacing: 0.4,
  },
  headlineSubtitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 18,
  },
  actionButtonsWrap: {
    gap: 10,
    marginTop: 10,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedBtnText: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },
  signInLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInLinkText: {
    fontSize: 12,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
});
