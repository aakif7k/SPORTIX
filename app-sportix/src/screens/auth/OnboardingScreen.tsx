/**
 * src/screens/auth/OnboardingScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 6-step onboarding flow:
 * 1. Role selection
 * 2. Identity (name, username — pre-filled, editable)
 * 3. Details (DOB with 13+ age gate, experience level)
 * 4. Sports (multi-select from sportix_sport_roles)
 * 5. Avatar upload
 * 6. Connect (summary → set is_onboarding_complete: true)
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, ChevronLeft, Check, Camera, User } from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { NeonButton } from '../../components/ui/NeonButton';
import { useAuthStore } from '../../store/authStore';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import { getAllSportsRoles } from '../../services/sportsRoleService';
import { UserRole, ExperienceLevel } from '../../types';

const ROLES: Array<{ key: UserRole; label: string; emoji: string; desc: string }> = [
  { key: 'athlete',    label: 'Athlete',    emoji: '⚡', desc: 'Compete, train, grow' },
  { key: 'coach',      label: 'Coach',      emoji: '🎯', desc: 'Lead and develop talent' },
  { key: 'organizer',  label: 'Organizer',  emoji: '🏆', desc: 'Run events and tournaments' },
  { key: 'recruiter',  label: 'Recruiter',  emoji: '🔍', desc: 'Discover and scout talent' },
];

const EXPERIENCE_LEVELS: Array<{ key: ExperienceLevel; label: string }> = [
  { key: 'amateur',   label: 'Amateur'   },
  { key: 'semi_pro',  label: 'Semi-Pro'  },
  { key: 'pro',       label: 'Pro'       },
  { key: 'elite',     label: 'Elite'     },
];

function isOver13(dob: string): boolean {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return age >= 13;
}

export function OnboardingScreen() {
  const { colors } = useTheme();
  const profile     = useAuthStore(state => state.profile);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const [step,       setStep]       = useState(0);
  const [saving,     setSaving]     = useState(false);

  // Step 1
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'athlete');

  // Step 2
  const [location, setLocation] = useState(profile?.location ?? '');
  const [bio,      setBio]      = useState(profile?.bio      ?? '');

  // Step 3
  const [dob,             setDob]             = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level ?? 'amateur');
  const [dobError,        setDobError]        = useState('');

  // Step 4
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [selectedSports,  setSelectedSports]  = useState<string[]>(profile?.sports ?? []);

  // Step 5
  const [avatarUri,  setAvatarUri]  = useState<string | null>(null);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    getAllSportsRoles().then(roles => setAvailableSports(roles.map(r => r.sport)));
  }, []);

  const goNext = useCallback(async () => {
    if (step === 2) {
      setDobError('');
      if (dob && !isOver13(dob)) {
        setDobError('You must be at least 13 years old to use SPORTiX.');
        return;
      }
    }
    if (step < 5) {
      setStep(s => s + 1);
    } else {
      await handleFinish();
    }
  }, [step, dob]);

  const goPrev = () => setStep(s => Math.max(0, s - 1));

  const pickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const asset = result.assets[0];
        const url = await profileService.uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
        setAvatarUri(asset.uri);
        setAvatarUrl(url);
      } catch {
        Alert.alert('Upload failed', 'Could not upload avatar. You can set it later from your profile.');
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const handleFinish = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await profileService.completeOnboarding({
        role,
        sport:            selectedSports[0] ?? 'Football',
        sports:           selectedSports,
        experience_level: experienceLevel,
        location,
        bio,
        avatar_url:       avatarUrl,
      });
      updateProfile(updated);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [role, selectedSports, experienceLevel, location, bio, avatarUrl]);

  const toggleSport = (sport: string) => {
    setSelectedSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <Animated.View key="step0" entering={FadeInRight} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            Who are you in the arena?
          </Text>
          <Text style={[styles.stepSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
            This shapes your entire SPORTiX experience
          </Text>
          <View style={styles.roleGrid}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRole(r.key)}
                style={[
                  styles.roleCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  role === r.key && { borderColor: colors.volt, backgroundColor: colors.voltDim },
                ]}
              >
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <Text style={[styles.roleLabel, { color: colors.textPrimary, fontFamily: 'Urbanist_700Bold' }]}>{r.label}</Text>
                <Text style={[styles.roleDesc, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>{r.desc}</Text>
                {role === r.key && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.volt }]}>
                    <Check size={12} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      );

      case 1: return (
        <Animated.View key="step1" entering={FadeInRight} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            Tell us more
          </Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="City, Country"
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Bio</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: colors.border, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="Tell the arena who you are..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>
      );

      case 2: return (
        <Animated.View key="step2" entering={FadeInRight} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            Your details
          </Text>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>
              Date of Birth (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevated, color: colors.textPrimary, borderColor: dobError ? colors.danger : colors.border, fontFamily: 'Urbanist_400Regular' }]}
              placeholder="1998-05-20"
              placeholderTextColor={colors.textMuted}
              value={dob}
              onChangeText={setDob}
              keyboardType="numeric"
            />
            {dobError ? <Text style={[styles.hint, { color: colors.danger, fontFamily: 'Urbanist_400Regular' }]}>{dobError}</Text> : null}
            <Text style={[styles.hint, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
              You must be 13 or older to join SPORTiX
            </Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>Experience Level</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE_LEVELS.map(el => (
                <TouchableOpacity
                  key={el.key}
                  onPress={() => setExperienceLevel(el.key)}
                  style={[
                    styles.chip,
                    { borderColor: colors.border },
                    experienceLevel === el.key && { backgroundColor: colors.volt, borderColor: colors.volt },
                  ]}
                >
                  <Text style={[styles.chipText, { color: experienceLevel === el.key ? '#000' : colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' }]}>
                    {el.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      );

      case 3: return (
        <Animated.View key="step3" entering={FadeInRight} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            Your sports
          </Text>
          <Text style={[styles.stepSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
            Select all sports you participate in
          </Text>
          <ScrollView style={styles.sportsList} showsVerticalScrollIndicator={false}>
            <View style={styles.sportsGrid}>
              {availableSports.map(sport => (
                <TouchableOpacity
                  key={sport}
                  onPress={() => toggleSport(sport)}
                  style={[
                    styles.sportChip,
                    { borderColor: colors.border },
                    selectedSports.includes(sport) && { backgroundColor: colors.voltDim, borderColor: colors.volt },
                  ]}
                >
                  <Text style={[
                    styles.sportChipText,
                    { color: selectedSports.includes(sport) ? colors.volt : colors.textSecondary, fontFamily: 'Urbanist_600SemiBold' },
                  ]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {selectedSports.length > 0 && (
            <Text style={[styles.hint, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
              Selected: {selectedSports.join(', ')}
            </Text>
          )}
        </Animated.View>
      );

      case 4: return (
        <Animated.View key="step4" entering={FadeInRight} style={[styles.stepContent, styles.avatarStep]}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            Your avatar
          </Text>
          <Text style={[styles.stepSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
            Show the arena who you are
          </Text>
          <TouchableOpacity onPress={pickAvatar} disabled={uploading} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <User size={48} color={colors.textMuted} />
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.volt }]}>
              <Camera size={14} color="#000" />
            </View>
          </TouchableOpacity>
          {uploading && <Text style={[styles.hint, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>Uploading...</Text>}
          <Text style={[styles.hint, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular', textAlign: 'center' }]}>
            You can skip this and add it later from your profile
          </Text>
        </Animated.View>
      );

      case 5: return (
        <Animated.View key="step5" entering={FadeInRight} style={[styles.stepContent, styles.avatarStep]}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary, fontFamily: 'Urbanist_800ExtraBold' }]}>
            You're all set!
          </Text>
          <Text style={[styles.stepSub, { color: colors.textMuted, fontFamily: 'Urbanist_400Regular' }]}>
            Your athlete profile is ready
          </Text>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { marginBottom: 20 }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 20 }]}>
              <User size={40} color={colors.textMuted} />
            </View>
          )}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SummaryRow label="Role"       value={role.charAt(0).toUpperCase() + role.slice(1)} colors={colors} />
            <SummaryRow label="Experience" value={experienceLevel}                              colors={colors} />
            <SummaryRow label="Location"   value={location || 'Not set'}                        colors={colors} />
            <SummaryRow label="Sports"     value={selectedSports.slice(0, 3).join(', ') || 'None'} colors={colors} />
          </View>
        </Animated.View>
      );

      default: return null;
    }
  };

  return (
    <LinearGradient colors={['#060606', '#0E0E0E', '#060606']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= step ? colors.volt : colors.surface }]} />
          ))}
        </View>
        <Text style={[styles.stepCounter, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>
          Step {step + 1} of 6
        </Text>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity onPress={goPrev} style={[styles.backBtn, { borderColor: colors.border }]}>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : <View style={{ width: 48 }} />}

          <NeonButton
            label={step === 5 ? "Enter the Arena 🚀" : "Continue"}
            onPress={goNext}
            loading={saving || (step === 4 && uploading)}
            size="md"
            style={{ flex: 1, marginLeft: step > 0 ? 12 : 0 }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SummaryRow({ label, value, colors }: any) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted, fontFamily: 'Urbanist_500Medium' }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily: 'Urbanist_600SemiBold' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:              { flex: 1 },
  scrollContent:     { padding: 24, paddingBottom: 16 },
  progressContainer: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 16, justifyContent: 'center' },
  progressDot:       { flex: 1, height: 4, borderRadius: 2 },
  stepCounter:       { textAlign: 'center', fontSize: 12, marginTop: 8 },
  stepContent:       { flex: 1, gap: 20 },
  stepTitle:         { fontSize: 26, lineHeight: 32 },
  stepSub:           { fontSize: 15, marginTop: -12 },
  fieldGroup:        { gap: 6 },
  label:             { fontSize: 13, letterSpacing: 0.2 },
  input:             { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  textArea:          { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, minHeight: 100 },
  hint:              { fontSize: 12, marginTop: 4 },
  roleGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard:          { width: '47%', borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 4, position: 'relative' },
  roleEmoji:         { fontSize: 24 },
  roleLabel:         { fontSize: 15 },
  roleDesc:          { fontSize: 12 },
  checkBadge:        { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipRow:           { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:              { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipText:          { fontSize: 13 },
  sportsList:        { maxHeight: 280 },
  sportsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip:         { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5 },
  sportChipText:     { fontSize: 12 },
  avatarStep:        { alignItems: 'center' },
  avatarContainer:   { position: 'relative', marginVertical: 12 },
  avatar:            { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge:   { position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryCard:       { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  summaryLabel:      { fontSize: 14 },
  summaryValue:      { fontSize: 14 },
  navRow:            { flexDirection: 'row', padding: 20, paddingTop: 12, gap: 0 },
  backBtn:           { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
