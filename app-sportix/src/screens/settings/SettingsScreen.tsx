/**
 * src/screens/settings/SettingsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Futuristic Control Room Settings — SPORTiX Mobile.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Moon,
  Sun,
  Fingerprint,
  LogOut,
  Trash2,
  Bell,
  Vibrate,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { unsubscribeAll } from '../../utils/realtimeManager';
import { triggerHaptic } from '../../utils/haptics';

export function SettingsScreen({ navigation }: any) {
  const { colors, mode, setMode } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [loggingOut, setLoggingOut] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [neonGlowEnabled, setNeonGlowEnabled] = useState(true);

  const handleLogout = async () => {
    triggerHaptic('medium');
    Alert.alert('Sign Out of SPORTiX', 'Are you sure you want to end your current athletic session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          unsubscribeAll();
          await authService.logout();
          clearAuth();
          setLoggingOut(false);
        },
      },
    ]);
  };

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
            <Text style={styles.topTitleText}>CONTROL ROOM</Text>
            <Text style={styles.topSubText}>APP PREFERENCES</Text>
          </View>

          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>V1.6</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Account Summary Card ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.accountCard}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.accountInfo}>
              <Text style={styles.fullName}>{profile?.full_name || 'SPORTiX Athlete'}</Text>
              <Text style={styles.username}>@{profile?.username || 'athlete'}</Text>
              <View style={styles.sportBadge}>
                <Text style={styles.sportBadgeText}>
                  ⚡ {(profile?.sport || 'FOOTBALL').toUpperCase()} • LVL {profile?.level || 14}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── 2. Display & Appearance ──────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>APPEARANCE & VISUAL MATRIX</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(204, 255, 0, 0.12)' }]}>
                  <Moon size={16} color="#CCFF00" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Cyber Dark Theme</Text>
                  <Text style={styles.settingSub}>Obsidian black with neon luminance</Text>
                </View>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={(v) => {
                  triggerHaptic('selection');
                  setMode(v ? 'dark' : 'light');
                }}
                thumbColor={mode === 'dark' ? '#CCFF00' : '#FFF'}
                trackColor={{ false: '#1E293B', true: 'rgba(204, 255, 0, 0.3)' }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(0, 212, 255, 0.12)' }]}>
                  <Sparkles size={16} color="#00D4FF" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Neon Aura Glows</Text>
                  <Text style={styles.settingSub}>Ambient background radial lighting</Text>
                </View>
              </View>
              <Switch
                value={neonGlowEnabled}
                onValueChange={(v) => {
                  triggerHaptic('selection');
                  setNeonGlowEnabled(v);
                }}
                thumbColor={neonGlowEnabled ? '#00D4FF' : '#FFF'}
                trackColor={{ false: '#1E293B', true: 'rgba(0, 212, 255, 0.3)' }}
              />
            </View>
          </View>

          {/* ── 3. Haptics & Feedback ────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>TACTILE & HAPTIC FEEDBACK</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(191, 95, 255, 0.12)' }]}>
                  <Vibrate size={16} color="#BF5FFF" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Fluid Touch Haptics</Text>
                  <Text style={styles.settingSub}>Vibrational feedback on taps & buttons</Text>
                </View>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(v) => {
                  triggerHaptic('selection');
                  setHapticsEnabled(v);
                }}
                thumbColor={hapticsEnabled ? '#BF5FFF' : '#FFF'}
                trackColor={{ false: '#1E293B', true: 'rgba(191, 95, 255, 0.3)' }}
              />
            </View>
          </View>

          {/* ── 4. Notifications ─────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>NOTIFICATIONS & ALERTS</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(255, 107, 0, 0.12)' }]}>
                  <Bell size={16} color="#FF6B00" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Clash & Tournament Alerts</Text>
                  <Text style={styles.settingSub}>Match kickoffs and AutoSquad invites</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => {
                  triggerHaptic('selection');
                  setNotificationsEnabled(v);
                }}
                thumbColor={notificationsEnabled ? '#FF6B00' : '#FFF'}
                trackColor={{ false: '#1E293B', true: 'rgba(255, 107, 0, 0.3)' }}
              />
            </View>
          </View>

          {/* ── 5. Session Sign Out ───────────────────────────────────── */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.88}
          >
            <LogOut size={16} color="#FF3B30" />
            <Text style={styles.signOutBtnText}>
              {loggingOut ? 'SIGNING OUT...' : 'SIGN OUT OF SPORTIX'}
            </Text>
          </TouchableOpacity>
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
    color: '#FFF',
    letterSpacing: 0.8,
  },
  topSubText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  versionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionPillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#CCFF00',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  fullName: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  username: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },
  sportBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  sportBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },

  sectionCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFF',
  },
  settingSub: {
    fontSize: 10,
    fontFamily: 'Urbanist_400Regular',
    color: '#64748B',
  },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    marginTop: 4,
  },
  signOutBtnText: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.6,
  },
});
