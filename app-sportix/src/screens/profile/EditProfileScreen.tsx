/**
 * src/screens/profile/EditProfileScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Edit Athletic DNA & Profile — SPORTiX Mobile.
 * Allows editing full name, username, bio, primary & secondary sports,
 * tactical role, experience level, location, and open-to-recruit status.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Camera,
  Check,
  Zap,
  MapPin,
  Shield,
  User,
  Activity,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { profileService } from '../../services/profileService';
import { triggerHaptic } from '../../utils/haptics';

import { ExperienceLevel } from '../../types';

const AVAILABLE_SPORTS = [
  'Football',
  'Basketball',
  'Cricket',
  'Tennis',
  'Badminton',
  'Volleyball',
  'Running',
  'Padel',
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string }[] = [
  { id: 'amateur', label: 'AMATEUR' },
  { id: 'semi_pro', label: 'SEMI-PRO' },
  { id: 'pro', label: 'PRO' },
  { id: 'elite', label: 'ELITE' },
];

export function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [selectedSport, setSelectedSport] = useState(profile?.sport || 'Football');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level || 'semi_pro');
  const [isOpenToRecruit, setIsOpenToRecruit] = useState(profile?.is_open_to_recruit ?? true);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    triggerHaptic('medium');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const url = await profileService.uploadAvatar(
          result.assets[0].uri,
          result.assets[0].mimeType ?? 'image/jpeg'
        );
        setAvatarUrl(url);
      } catch {
        Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    triggerHaptic('heavy');
    setSaving(true);

    try {
      const updated = await profileService.updateProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        sport: selectedSport,
        experience_level: experienceLevel,
        is_open_to_recruit: isOpenToRecruit,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      updateProfile(updated);
      Alert.alert('Success! 🎉', 'Your athletic DNA has been updated.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Update Error', e.message ?? 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
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
            <Text style={styles.topTitleText}>EDIT ATHLETIC DNA</Text>
            <Text style={styles.topSubText}>PASSPORT CONFIGURATION</Text>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>SAVE</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Edit Section */}
          <Animated.View entering={FadeInDown.duration(350)} style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri:
                    avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraCircle}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Camera size={14} color="#000" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Tap camera to change passport photo</Text>
          </Animated.View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>ATHLETE IDENTITY</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. alex_rivera"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LOCATION / CITY</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Chennai, India"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BIO / MOTTO</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="e.g. Attacking playmaker with high spatial awareness."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Sport Discipline Selection */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>PRIMARY SPORT DISCIPLINE</Text>
            <View style={styles.sportsGrid}>
              {AVAILABLE_SPORTS.map((sport) => {
                const isSel = selectedSport.toLowerCase() === sport.toLowerCase();
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.sportChip, isSel && styles.sportChipActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedSport(sport);
                    }}
                  >
                    <Text style={[styles.sportChipText, isSel && styles.sportChipTextActive]}>
                      {sport.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Competitive Experience Tier */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>COMPETITIVE TIER</Text>
            <View style={styles.tierRow}>
              {EXPERIENCE_LEVELS.map((tier) => {
                const isSel = experienceLevel === tier.id;
                return (
                  <TouchableOpacity
                    key={tier.id}
                    style={[styles.tierChip, isSel && styles.tierChipActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setExperienceLevel(tier.id);
                    }}
                  >
                    <Text style={[styles.tierChipText, isSel && styles.tierChipTextActive]}>
                      {tier.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Scout & Recruitment Toggle */}
          <View style={styles.formCard}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>OPEN TO SCOUT & RECRUIT</Text>
                <Text style={styles.toggleSub}>
                  Allow squad captains and tournament organizers to invite you.
                </Text>
              </View>
              <Switch
                value={isOpenToRecruit}
                onValueChange={(v) => {
                  triggerHaptic('selection');
                  setIsOpenToRecruit(v);
                }}
                thumbColor={isOpenToRecruit ? '#CCFF00' : '#FFF'}
                trackColor={{ false: '#1E293B', true: 'rgba(204, 255, 0, 0.3)' }}
              />
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
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
  saveBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.5,
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  avatarWrap: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: '#CCFF00',
    padding: 2,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  cameraCircle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  changePhotoText: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },

  /* Form Cards */
  formCard: {
    backgroundColor: '#080808',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  formHeading: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  textInput: {
    backgroundColor: '#0E0E0E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bioInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },

  /* Sports Grid */
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sportChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  sportChipText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  sportChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Tier Row */
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierChip: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tierChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  tierChipText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  tierChipTextActive: {
    color: '#00D4FF',
    fontFamily: 'Urbanist_900Black',
  },

  /* Toggle Row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  toggleSub: {
    fontSize: 10,
    fontFamily: 'Urbanist_400Regular',
    color: '#64748B',
    marginTop: 2,
  },
});
