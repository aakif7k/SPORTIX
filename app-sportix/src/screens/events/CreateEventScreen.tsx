/**
 * src/screens/events/CreateEventScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Host Tournament Wizard — 1:1 Parity with Web App & Mobile Screenshots.
 * Features:
 * - Top App Bar with brand, notifications bell, settings, avatar
 * - Header Hero Card: Back Button, "🏆 TOURNAMENT ORGANIZER", "HOST TOURNAMENT"
 * - 4-Step Indicator Bar with active orange pill & completed checkmarks
 * - Step 1: Tournament Basics (Title, Sport dropdown, Date, Venue, Location, Banner Image Upload)
 * - Step 2: Prizes & Rules (Prize Pool, Entry Fee)
 * - Step 3: Squad Limits & AI AutoSquad (Max Teams, AutoSquad toggle)
 * - Step 4: Review & Publish (Summary Card + "🚀 LAUNCH TOURNAMENT LIVE" Button)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Sparkles,
  Plus,
  Check,
  Upload,
  Zap,
  Bell,
  Settings,
  Shield,
  Clock,
  Coins,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { eventService } from '../../services/eventService';
import { triggerHaptic } from '../../utils/haptics';

const STEPS = ['Basics', 'Rules & Fees', 'Teams', 'Review & Host'];

const SPORT_LIST = [
  'Football',
  'Basketball',
  'Cricket',
  'Tennis',
  'Volleyball',
  'Badminton',
  'Running',
  'Padel',
];

const SKILL_LEVELS = ['Amateur', 'Semi-Pro', 'Pro', 'Elite', 'All Levels'];

export function CreateEventScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);

  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Football');
  const [skillLevel, setSkillLevel] = useState('Semi-Pro');
  const [date, setDate] = useState('2026-08-25');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [prizePool, setPrizePool] = useState('€1,000');
  const [entryFee, setEntryFee] = useState('€20');
  const [maxTeams, setMaxTeams] = useState('32');
  const [bannerUri, setBannerUri] = useState<string>(
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'
  );

  const handlePickBanner = async () => {
    triggerHaptic('medium');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setBannerUri(result.assets[0].uri);
    }
  };

  const handleNextStep = () => {
    triggerHaptic('selection');
    if (step === 0) {
      if (!title.trim()) {
        Alert.alert('Required Field', 'Please enter a Tournament Title.');
        return;
      }
      if (!venue.trim() && !location.trim()) {
        Alert.alert('Required Field', 'Please specify a Venue or City / Location.');
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handlePrevStep = () => {
    triggerHaptic('selection');
    setStep((s) => Math.max(0, s - 1));
  };

  const handlePublish = async () => {
    triggerHaptic('heavy');
    setIsPublishing(true);

    try {
      const newEv = await eventService.createEvent({
        title: title.trim(),
        description: `Organized by ${profile?.full_name || 'SPORTiX Captain'}. Prize: ${prizePool} | Fee: ${entryFee} | Skill: ${skillLevel}`,
        sport: sport,
        event_type: 'tournament',
        date: date,
        location: venue ? `${venue}, ${location}` : location || venue || 'Local Arena',
        max_participants: parseInt(maxTeams, 10) || 32,
        entry_fee: entryFee,
        prize_pool: prizePool,
        skill_level: skillLevel.toLowerCase().replace('-', '_').replace(' ', '_'),
        banner_image_url: bannerUri,
      });

      Alert.alert('🏆 Tournament Live!', 'Your tournament is now published on ClashHub.', [
        {
          text: 'View Tournament',
          onPress: () => navigation.replace('EventDetail', { eventId: newEv.$id }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Publishing Error', err.message || 'Could not launch tournament.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── 0. Top App Bar ────────────────────────────────────────────── */}
        <View style={styles.topAppBar}>
          <View style={styles.topBrand}>
            <View style={styles.brandLogoHex}>
              <Zap size={15} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.brandTitle}>SPORTIX</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Notifications');
              }}
              style={styles.iconCircleBtn}
            >
              <Bell size={18} color="#FFF" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Settings');
              }}
            >
              <Settings size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('ProfileDNATab');
              }}
            >
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
                }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Header Hero Card (Matches All 4 Screenshots) ─────────── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.headerHeroBanner}>
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
              <View style={styles.organizerTagRow}>
                <Trophy size={12} color="#FF6B00" />
                <Text style={styles.organizerTagText}>TOURNAMENT ORGANIZER</Text>
              </View>
              <Text style={styles.headerTitleText}>HOST TOURNAMENT</Text>
            </View>
          </Animated.View>

          {/* ── 2. 4-Step Indicator Bar ─────────────────────────────────── */}
          <View style={styles.stepsIndicatorRow}>
            {STEPS.map((s, idx) => {
              const isCurrent = step === idx;
              const isDone = idx < step;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.stepPill,
                    isCurrent && styles.stepPillActive,
                    isDone && styles.stepPillDone,
                  ]}
                  onPress={() => {
                    if (idx <= step) {
                      triggerHaptic('selection');
                      setStep(idx);
                    }
                  }}
                  disabled={idx > step}
                >
                  {isDone ? (
                    <Check size={14} color="#CCFF00" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepPillText,
                        isCurrent && styles.stepPillTextActive,
                      ]}
                    >
                      {idx + 1}.
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 3. Step Content Card ─────────────────────────────────────── */}
          <View style={styles.wizardCard}>
            {/* ══════════════════════════════════════════════════════════════
                STEP 1: TOURNAMENT BASICS (Screenshot 4)
            ═══════════════════════════════════════════════════════════════ */}
            {step === 0 && (
              <Animated.View entering={FadeInRight.duration(250)} style={styles.stepBlock}>
                <View style={styles.stepHeadingRow}>
                  <Sparkles size={16} color="#FF6B00" />
                  <Text style={styles.stepHeadingTitle}>STEP 1: TOURNAMENT BASICS</Text>
                </View>

                {/* Tournament Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    TOURNAMENT TITLE <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Summer Champions League 5v5"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Sport Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    SPORT CATEGORY <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sportsScroll}
                  >
                    {SPORT_LIST.map((s) => {
                      const isSel = sport.toLowerCase() === s.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.sportChip, isSel && styles.sportChipActive]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSport(s);
                          }}
                        >
                          <Text style={[styles.sportChipText, isSel && styles.sportChipTextActive]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Match Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    MATCH DATE <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.dateInputWrap}>
                    <Calendar size={16} color="#FF6B00" />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                      value={date}
                      onChangeText={setDate}
                    />
                  </View>
                </View>

                {/* Venue / Field Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    VENUE / FIELD NAME <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Olympic Turf Arena"
                    placeholderTextColor="#64748B"
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>

                {/* City / Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    CITY / LOCATION <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. London, UK"
                    placeholderTextColor="#64748B"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                {/* Banner Upload */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>TOURNAMENT BANNER IMAGE</Text>
                  <View style={styles.bannerRow}>
                    <Image source={{ uri: bannerUri }} style={styles.bannerPreview} />
                    <TouchableOpacity style={styles.uploadBannerBtn} onPress={handlePickBanner}>
                      <Upload size={14} color="#FFF" />
                      <Text style={styles.uploadBannerBtnText}>UPLOAD BANNER</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 2: PRIZES & RULES (Screenshot 3)
            ═══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <Animated.View entering={FadeInRight.duration(250)} style={styles.stepBlock}>
                <View style={styles.stepHeadingRow}>
                  <Trophy size={16} color="#CCFF00" />
                  <Text style={styles.stepHeadingTitle}>STEP 2: PRIZES & RULES</Text>
                </View>

                {/* Prize Pool */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PRIZE POOL</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. €1,000"
                    placeholderTextColor="#64748B"
                    value={prizePool}
                    onChangeText={setPrizePool}
                  />
                </View>

                {/* Entry Fee */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ENTRY FEE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. €20"
                    placeholderTextColor="#64748B"
                    value={entryFee}
                    onChangeText={setEntryFee}
                  />
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 3: SQUAD LIMITS & AI AUTOSQUAD (Screenshot 2)
            ═══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <Animated.View entering={FadeInRight.duration(250)} style={styles.stepBlock}>
                <View style={styles.stepHeadingRow}>
                  <Plus size={16} color="#00D4FF" />
                  <Text style={styles.stepHeadingTitle}>
                    STEP 3: SQUAD LIMITS & AI AUTOSQUAD
                  </Text>
                </View>

                {/* Max Teams */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MAX TEAMS</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="32"
                    placeholderTextColor="#64748B"
                    value={maxTeams}
                    onChangeText={setMaxTeams}
                    keyboardType="numeric"
                  />
                </View>

                {/* Skill Level / Competitive Tier */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    COMPETITIVE SKILL LEVEL <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sportsScroll}
                  >
                    {SKILL_LEVELS.map((tier) => {
                      const isSel = skillLevel.toLowerCase() === tier.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={tier}
                          style={[styles.sportChip, isSel && styles.skillChipActive]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSkillLevel(tier);
                          }}
                        >
                          <Text style={[styles.sportChipText, isSel && styles.sportChipTextActive]}>
                            {tier}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </Animated.View>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 4: REVIEW & PUBLISH (Screenshot 1)
            ═══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <Animated.View entering={FadeInRight.duration(250)} style={styles.stepBlock}>
                <View style={styles.stepHeadingRow}>
                  <Check size={16} color="#CCFF00" />
                  <Text style={styles.stepHeadingTitle}>STEP 4: REVIEW & PUBLISH</Text>
                </View>

                {/* Review Card */}
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitleText}>
                    TITLE: <Text style={{ color: '#FFF' }}>{title || 'Untitled Tournament'}</Text>
                  </Text>
                  <Text style={styles.reviewSubText}>
                    SPORT: {sport.toUpperCase()} | SKILL: {skillLevel.toUpperCase()} | DATE: {date}
                  </Text>
                  <Text style={styles.reviewSubText}>
                    LOCATION: {venue ? `${venue}, ` : ''}{location || 'Local Arena'}
                  </Text>
                  <Text style={styles.reviewPrizeText}>
                    PRIZE: {prizePool} | FEE: {entryFee} | TEAMS: {maxTeams}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* ── 4. Bottom Wizard Navigation Controls ────────────────── */}
            <View style={styles.wizardControlsRow}>
              {step > 0 ? (
                <TouchableOpacity style={styles.prevBtn} onPress={handlePrevStep}>
                  <Text style={styles.prevBtnText}>BACK</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 80 }} />
              )}

              {step < STEPS.length - 1 ? (
                <TouchableOpacity style={styles.nextStepBtn} onPress={handleNextStep}>
                  <Text style={styles.nextStepBtnText}>NEXT STEP</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.launchBtn}
                  onPress={handlePublish}
                  disabled={isPublishing}
                  activeOpacity={0.88}
                >
                  {isPublishing ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={styles.launchBtnText}>🚀 LAUNCH TOURNAMENT LIVE</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoHex: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CCFF00',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  /* Hero Banner */
  headerHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  organizerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerTagText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Step Indicator Row */
  stepsIndicatorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepPill: {
    flex: 1,
    backgroundColor: '#080808',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepPillActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  stepPillDone: {
    backgroundColor: '#0E0E0E',
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  stepPillText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
  },
  stepPillTextActive: {
    color: '#000',
  },

  /* Wizard Card */
  wizardCard: {
    backgroundColor: '#080808',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  stepBlock: {
    gap: 14,
  },
  stepHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepHeadingTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.8,
  },

  /* Inputs */
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  requiredStar: {
    color: '#FF3B30',
  },
  textInput: {
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFF',
  },
  sportsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  sportChip: {
    backgroundColor: '#0E0E0E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sportChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  skillChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  sportChipText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  sportChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Banner Row */
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerPreview: {
    width: 80,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadBannerBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
    letterSpacing: 0.5,
  },

  /* Review Card */
  reviewCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  reviewTitleText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  reviewSubText: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
  reviewPrizeText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    marginTop: 2,
  },

  /* Bottom Controls */
  wizardControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
    marginTop: 4,
  },
  prevBtn: {
    backgroundColor: '#0E0E0E',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  prevBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  nextStepBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  nextStepBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  launchBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },
});
