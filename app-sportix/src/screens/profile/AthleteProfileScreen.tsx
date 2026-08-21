/**
 * src/screens/profile/AthleteProfileScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public Athlete Profile — 1:1 Parity with Web App.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Zap,
  MapPin,
  CheckCircle2,
  Activity,
  TrendingUp,
  MessageCircle,
  UserPlus,
  UserCheck,
  Flame,
  Trophy,
  Video,
  Award,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { profileService } from '../../services/profileService';
import { messageService } from '../../services/messageService';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfile } from '../../types';

const TABS = ['OVERVIEW', 'VAULTD', 'PEAK STATS', 'MATCH HISTORY', 'GLORY BOARD'];

export function AthleteProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { colors } = useTheme();
  const myProfile = useAuthStore((state) => state.profile);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const isMe = myProfile?.$id === userId;

  useEffect(() => {
    const init = async () => {
      const [p, follows] = await Promise.all([
        profileService.getProfile(userId),
        !isMe ? profileService.isFollowing(userId) : Promise.resolve(false),
      ]);
      setProfile(p);
      setFollowing(follows);
      setLoading(false);
    };
    init();
  }, [userId, isMe]);

  const handleFollow = async () => {
    triggerHaptic('medium');
    const newState = await profileService.toggleFollow(userId);
    setFollowing(newState);
  };

  const handleMessage = async () => {
    triggerHaptic('selection');
    const conv = await messageService.getOrCreateDirectConversation(userId);
    navigation.navigate('DirectChat', {
      conversationId: conv.$id,
      title: profile?.full_name ?? 'Chat',
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#CCFF00" size="large" />
      </View>
    );
  }
  if (!profile) return null;

  return (
    <LinearGradient colors={['#000000', '#020305', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top App Bar */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
          >
            <ArrowLeft size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>@{profile.username}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.profileHeroCard}>
            <View style={styles.ssrBadgeWrap}>
              <View style={styles.ssrBadge}>
                <Zap size={10} color="#CCFF00" fill="#CCFF00" />
                <Text style={styles.ssrBadgeText}>SSR: PROVISIONAL</Text>
              </View>
            </View>

            <View style={styles.avatarCenterWrap}>
              <View style={styles.avatarOuter}>
                <Image
                  source={{
                    uri:
                      profile.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                  }}
                  style={styles.heroAvatarImg}
                  resizeMode="cover"
                />
                <View style={styles.verifiedCheckBadge}>
                  <CheckCircle2 size={12} color="#000" strokeWidth={3} fill="#CCFF00" />
                </View>
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.fullNameText}>{profile.full_name.toUpperCase()}</Text>
                <CheckCircle2 size={16} color="#CCFF00" strokeWidth={2.5} fill="#CCFF00" />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.handleText}>@{profile.username}</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <Text style={styles.metaSportText}>{profile.sport || 'Multi-Sport'}</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <View style={styles.skillBadgeMini}>
                  <Text style={styles.skillBadgeMiniText}>
                    {profile.experience_level ? profile.experience_level.replace('_', '-').toUpperCase() : 'SEMI-PRO'}
                  </Text>
                </View>
                {profile.location ? (
                  <>
                    <Text style={styles.dotSeparator}>·</Text>
                    <View style={styles.locationWrap}>
                      <MapPin size={10} color="#94A3B8" />
                      <Text style={styles.locationText}>{profile.location}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Actions for other user */}
            {!isMe && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.connectBtn, following && styles.connectedBtn]}
                  onPress={handleFollow}
                >
                  {following ? (
                    <>
                      <UserCheck size={14} color="#94A3B8" />
                      <Text style={styles.connectedBtnText}>CONNECTED</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} color="#000" strokeWidth={2.5} />
                      <Text style={styles.connectBtnText}>CONNECT</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                  <MessageCircle size={14} color="#FFF" />
                  <Text style={styles.messageBtnText}>MESSAGE</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 4-Metric Grid */}
            <View style={styles.fourMetricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MATCHES PLAYED</Text>
                <Text style={styles.metricValWhite}>0</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>WIN RATE</Text>
                <Text style={styles.metricValVolt}>N/A</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>PULSE LEVEL</Text>
                <Text style={styles.metricValVolt}>Level {profile.level || 1}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>GLOBAL RANK</Text>
                <Text style={styles.metricValWhite}>Unranked</Text>
              </View>
            </View>
          </Animated.View>

          {/* Scouting Card */}
          <View style={styles.scoutingCard}>
            <View style={styles.scoutingLeft}>
              <View style={styles.flameIconWrap}>
                <Flame size={18} color="#CCFF00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoutingTitle}>Open for Squad Scouting & Matches</Text>
                <Text style={styles.scoutingSub}>
                  Allow tournament captains to view PlayerDNA radar
                </Text>
              </View>
            </View>
            <View style={styles.activeDotPill}>
              <Text style={styles.activeDotPillText}>ACTIVE</Text>
            </View>
          </View>

          {/* Tabs Rail */}
          <View style={styles.tabsRail}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {TABS.map((tab) => {
                const isSel = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabBtn, isSel && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab);
                    }}
                  >
                    <Text style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Overview Content */}
          {activeTab === 'OVERVIEW' && (
            <View style={styles.tabContentContainer}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Activity size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>ATHLETE BIO & SCOUTING PROFILE</Text>
                </View>
                <Text style={styles.bioBodyText}>{profile.bio || 'No bio provided yet.'}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  topNavTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  profileHeroCard: {
    backgroundColor: '#080808',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  ssrBadgeWrap: { alignItems: 'flex-end' },
  ssrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  ssrBadgeText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  avatarCenterWrap: { alignItems: 'center', gap: 6, marginTop: -8 },
  avatarOuter: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 2,
    backgroundColor: '#0E0E0E',
  },
  heroAvatarImg: { width: '100%', height: '100%', borderRadius: 20 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fullNameText: {
    fontSize: 18,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  handleText: { fontSize: 11, fontFamily: 'Urbanist_800ExtraBold', color: '#CCFF00' },
  dotSeparator: { color: '#64748B', fontSize: 11 },
  metaSportText: { fontSize: 11, fontFamily: 'Urbanist_600SemiBold', color: '#94A3B8' },
  skillBadgeMini: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  skillBadgeMiniText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#00D4FF',
    letterSpacing: 0.5,
  },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: 10, fontFamily: 'Urbanist_600SemiBold', color: '#94A3B8' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  connectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  connectedBtn: {
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectBtnText: { fontSize: 11, fontFamily: 'Urbanist_900Black', color: '#000' },
  connectedBtnText: { fontSize: 11, fontFamily: 'Urbanist_900Black', color: '#94A3B8' },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  messageBtnText: { fontSize: 11, fontFamily: 'Urbanist_900Black', color: '#FFF' },

  fourMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0E0E0E',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  metricBox: { flex: 1, minWidth: '45%', gap: 3, padding: 4 },
  metricLabel: { fontSize: 8, fontFamily: 'Urbanist_800ExtraBold', color: '#64748B' },
  metricValWhite: { fontSize: 17, fontFamily: 'Urbanist_900Black', color: '#FFF' },
  metricValVolt: { fontSize: 17, fontFamily: 'Urbanist_900Black', color: '#CCFF00' },

  scoutingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#080808',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scoutingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  flameIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutingTitle: { fontSize: 12, fontFamily: 'Urbanist_800ExtraBold', color: '#FFF' },
  scoutingSub: { fontSize: 9, fontFamily: 'Urbanist_400Regular', color: '#64748B', marginTop: 2 },
  activeDotPill: {
    backgroundColor: 'rgba(0, 255, 120, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 120, 0.3)',
  },
  activeDotPillText: { fontSize: 8, fontFamily: 'Urbanist_900Black', color: '#00FF78' },

  tabsRail: {
    marginHorizontal: -16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabsScroll: { paddingHorizontal: 16, gap: 8 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  tabBtnText: { fontSize: 10, fontFamily: 'Urbanist_800ExtraBold', color: '#94A3B8' },
  tabBtnTextActive: { color: '#000', fontFamily: 'Urbanist_900Black' },

  tabContentContainer: { gap: 14 },
  sectionCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeadingText: { fontSize: 11, fontFamily: 'Urbanist_900Black', color: '#FFF' },
  bioBodyText: { fontSize: 12, fontFamily: 'Urbanist_500Medium', color: '#94A3B8', lineHeight: 18 },
});
