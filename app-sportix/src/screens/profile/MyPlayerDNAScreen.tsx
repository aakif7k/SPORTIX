/**
 * src/screens/profile/MyPlayerDNAScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Player DNA Passport — 1:1 Parity with Web App & Mobile Screenshots.
 * Features:
 * - Top App Bar with brand, notifications bell, settings, avatar
 * - Hero Profile Card with SSR badge, rounded square avatar with verified checkmark,
 *   full name, handle, sport, location, bright Volt "EDIT PROFILE" button
 * - 4-Metric Grid (Matches Played, Win Rate, Pulse Level, Global Rank)
 * - Open for Squad Scouting & Matches Toggle
 * - 5 Horizontal Tabs: [OVERVIEW], [VAULTD], [PEAK STATS], [MATCH HISTORY], [GLORY BOARD]
 * - Tab 1: Athlete Bio & Scouting Profile (4-grid specs: Age, Height, Weight, Foot/Hand) + 6-Axis Radar
 * - Tab 2: VaultD Media Showcase
 * - Tab 3: Peak Performance Trends
 * - Tab 4: Match History (matches Screenshot 4)
 * - Tab 5: Glory Board / Badges
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Zap,
  Flame,
  Shield,
  Trophy,
  Edit3,
  MapPin,
  CheckCircle2,
  Activity,
  TrendingUp,
  Bell,
  Settings,
  Calendar,
  Award,
  Video,
  Eye,
  Heart,
  UserPlus,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { gamificationService } from '../../services/gamificationService';
import { triggerHaptic } from '../../utils/haptics';

const TABS = ['OVERVIEW', 'VAULTD', 'PEAK STATS', 'MATCH HISTORY', 'GLORY BOARD'];

export function MyPlayerDNAScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [openToRecruit, setOpenToRecruit] = useState(profile?.is_open_to_recruit ?? true);
  const [refreshing, setRefreshing] = useState(false);
  const [badgeCount, setBadgeCount] = useState(12);

  const fetchGameData = useCallback(async () => {
    try {
      const badges = await gamificationService.getMyBadges();
      if (badges) setBadgeCount(badges.length);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const handleRefresh = async () => {
    triggerHaptic('light');
    setRefreshing(true);
    await fetchGameData();
    setRefreshing(false);
  };

  const fullName = profile?.full_name || 'MUHAMMAD AAKIF';
  const username = profile?.username || 'aakif';
  const sport = profile?.sport || 'Multi-Sport';
  const location = profile?.location || 'New York, USA';
  const bio = profile?.bio || 'No bio provided yet.';
  const avatarUrl =
    profile?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80';

  const matchesPlayed = 0;
  const winRate = 'N/A';
  const pulseLevel = profile?.level ? `Level ${profile.level}` : 'Level 1';
  const globalRank = 'Unranked';
  const ssrStatus = 'Provisional';

  return (
    <LinearGradient colors={['#000000', '#020305', '#000000']} style={styles.flex}>
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
                navigation.navigate('EditProfile');
              }}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} resizeMode="cover" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#CCFF00"
            />
          }
        >
          {/* ── 1. Hero Profile Card (Matches Screenshot 1 & 2) ─────────── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.profileHeroCard}>
            {/* Top Right SSR Badge */}
            <View style={styles.ssrBadgeWrap}>
              <View style={styles.ssrBadge}>
                <Zap size={10} color="#CCFF00" fill="#CCFF00" />
                <Text style={styles.ssrBadgeText}>SSR: {ssrStatus}</Text>
              </View>
            </View>

            {/* Avatar with Verified Ring */}
            <View style={styles.avatarCenterWrap}>
              <View style={styles.avatarOuter}>
                <Image source={{ uri: avatarUrl }} style={styles.heroAvatarImg} resizeMode="cover" />
                <View style={styles.verifiedCheckBadge}>
                  <CheckCircle2 size={12} color="#000" strokeWidth={3} fill="#CCFF00" />
                </View>
              </View>

              {/* Name & Handle */}
              <View style={styles.nameRow}>
                <Text style={styles.fullNameText}>{fullName.toUpperCase()}</Text>
                <CheckCircle2 size={16} color="#CCFF00" strokeWidth={2.5} fill="#CCFF00" />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.handleText}>@{username}</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <Text style={styles.metaSportText}>{sport}</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <View style={styles.skillBadgeMini}>
                  <Text style={styles.skillBadgeMiniText}>
                    {profile?.experience_level ? profile.experience_level.replace('_', '-').toUpperCase() : 'SEMI-PRO'}
                  </Text>
                </View>
                {location ? (
                  <>
                    <Text style={styles.dotSeparator}>·</Text>
                    <View style={styles.locationWrap}>
                      <MapPin size={10} color="#94A3B8" />
                      <Text style={styles.locationText}>{location}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Edit Profile Button (Bright Volt Pill) */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                triggerHaptic('medium');
                navigation.navigate('EditProfile');
              }}
              activeOpacity={0.85}
            >
              <Edit3 size={14} color="#000" strokeWidth={2.5} />
              <Text style={styles.editProfileBtnText}>EDIT PROFILE</Text>
            </TouchableOpacity>

            {/* 4-Metric Grid */}
            <View style={styles.fourMetricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MATCHES PLAYED</Text>
                <Text style={styles.metricValWhite}>{matchesPlayed}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>WIN RATE</Text>
                <Text style={styles.metricValVolt}>{winRate}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>PULSE LEVEL</Text>
                <Text style={styles.metricValVolt}>{pulseLevel}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>GLOBAL RANK</Text>
                <Text style={styles.metricValWhite}>{globalRank}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── 2. Open for Scouting Toggle Card ─────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.scoutingCard}>
            <View style={styles.scoutingLeft}>
              <View style={styles.flameIconWrap}>
                <Flame size={18} color="#CCFF00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoutingTitle}>Open for Squad Scouting & Matches</Text>
                <Text style={styles.scoutingSub}>
                  Allow tournament captains to view your PlayerDNA radar
                </Text>
              </View>
            </View>
            <Switch
              value={openToRecruit}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setOpenToRecruit(val);
              }}
              thumbColor={openToRecruit ? '#CCFF00' : '#FFF'}
              trackColor={{ false: '#1E293B', true: 'rgba(204, 255, 0, 0.3)' }}
            />
          </Animated.View>

          {/* ── 3. Horizontal Navigation Tabs Rail ───────────────────────── */}
          <View style={styles.tabsRail}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
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
                    <Text style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 4. Tab Contents ─────────────────────────────────────────── */}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 1: [ OVERVIEW ] (Matches Screenshot 1)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'OVERVIEW' && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContentContainer}>
              {/* Bio & Physical Specs Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Activity size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>ATHLETE BIO & SCOUTING PROFILE</Text>
                </View>

                <Text style={styles.bioBodyText}>{bio}</Text>

                {/* 4-Grid Specs */}
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>AGE</Text>
                    <Text style={styles.specValVolt}>Not set</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>HEIGHT</Text>
                    <Text style={styles.specValWhite}>Not set</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>WEIGHT</Text>
                    <Text style={styles.specValWhite}>Not set</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>FOOT / HAND</Text>
                    <Text style={styles.specValVolt}>Not set</Text>
                  </View>
                </View>
              </View>

              {/* PlayerDNA Attribute Distribution (6-Axis Radar) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <TrendingUp size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>PLAYERDNA ATTRIBUTE DISTRIBUTION</Text>
                </View>

                {/* Cyber Radar Visual Grid */}
                <View style={styles.radarContainer}>
                  <View style={styles.radarPolygonOuter}>
                    <View style={styles.radarPolygonMid}>
                      <View style={styles.radarPolygonInner} />
                    </View>
                  </View>

                  {/* 6 Axis Labels */}
                  <Text style={[styles.radarAxisLabel, styles.radarTop]}>Pace</Text>
                  <Text style={[styles.radarAxisLabel, styles.radarTopRight]}>Shooting</Text>
                  <Text style={[styles.radarAxisLabel, styles.radarBottomRight]}>Passing</Text>
                  <Text style={[styles.radarAxisLabel, styles.radarBottom]}>Dribbling</Text>
                  <Text style={[styles.radarAxisLabel, styles.radarBottomLeft]}>Defense</Text>
                  <Text style={[styles.radarAxisLabel, styles.radarTopLeft]}>Physical</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 2: [ VAULTD ] — Highlight Media Vault
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'VAULTD' && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContentContainer}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Video size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>ATHLETE VAULTD HIGHLIGHTS</Text>
                </View>

                <View style={styles.vaultGrid}>
                  {[
                    { id: 'v1', title: 'Top Corner Free Kick', views: '1.2K', likes: 142, thumb: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80' },
                    { id: 'v2', title: 'Speed Drill Sprint 100m', views: '840', likes: 98, thumb: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80' },
                    { id: 'v3', title: 'Championship Winning Assist', views: '2.4K', likes: 310, thumb: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80' },
                    { id: 'v4', title: 'Agility Ladder Footwork', views: '650', likes: 74, thumb: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=400&q=80' },
                  ].map((item) => (
                    <View key={item.id} style={styles.vaultCard}>
                      <Image source={{ uri: item.thumb }} style={styles.vaultThumb} />
                      <View style={styles.vaultOverlay}>
                        <Text style={styles.vaultTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.vaultStatsRow}>
                          <View style={styles.vaultStatItem}>
                            <Eye size={10} color="#CCFF00" />
                            <Text style={styles.vaultStatText}>{item.views}</Text>
                          </View>
                          <View style={styles.vaultStatItem}>
                            <Heart size={10} color="#FF4D4D" />
                            <Text style={styles.vaultStatText}>{item.likes}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 3: [ PEAK STATS ] — Career Trends
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'PEAK STATS' && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContentContainer}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <TrendingUp size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>CAREER PERFORMANCE TRENDS</Text>
                </View>

                <View style={styles.peakBarsList}>
                  {[
                    { metric: 'Offensive Efficiency', val: 88, color: '#CCFF00' },
                    { metric: 'Defensive Workrate', val: 74, color: '#00D4FF' },
                    { metric: 'Team Coordination', val: 92, color: '#BF5FFF' },
                    { metric: 'Match Impact (SSR)', val: 85, color: '#FFB800' },
                  ].map((bar) => (
                    <View key={bar.metric} style={styles.peakBarItem}>
                      <View style={styles.peakBarTop}>
                        <Text style={styles.peakBarLabel}>{bar.metric}</Text>
                        <Text style={[styles.peakBarVal, { color: bar.color }]}>{bar.val}%</Text>
                      </View>
                      <View style={styles.peakBarTrack}>
                        <View style={[styles.peakBarFill, { width: `${bar.val}%`, backgroundColor: bar.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 4: [ MATCH HISTORY ] (Matches Screenshot 2 & 4)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'MATCH HISTORY' && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContentContainer}>
              <View style={styles.emptyHistoryCard}>
                <View style={styles.trophyIconWrap}>
                  <Trophy size={24} color="#CCFF00" />
                </View>
                <Text style={styles.emptyHistoryTitle}>Play a match to build your history.</Text>
                <Text style={styles.emptyHistorySub}>
                  Compete in events & tournaments to log match statistics, earn SSR ratings, and record your performance.
                </Text>

                <TouchableOpacity
                  style={styles.findMatchBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    navigation.navigate('ClashubTab');
                  }}
                >
                  <Text style={styles.findMatchBtnText}>FIND TOURNAMENTS & CLASHES</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 5: [ GLORY BOARD ] — Badges & Achievements
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'GLORY BOARD' && (
            <Animated.View entering={FadeInDown.duration(250)} style={styles.tabContentContainer}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Award size={16} color="#CCFF00" />
                  <Text style={styles.sectionHeadingText}>ATHLETIC GLORY BOARD</Text>
                </View>

                <View style={styles.gloryGrid}>
                  {[
                    { title: 'Early Adopter', tier: 'GOLD', desc: 'Joined SPORTiX genesis wave' },
                    { title: 'Match Winner', tier: 'PRO', desc: '10 Tournament victories' },
                    { title: 'Playmaker XI', tier: 'ELITE', desc: '90%+ Team chemistry record' },
                    { title: 'Pulse Legend', tier: 'MYTHIC', desc: 'Achieved 1,000+ Pulse score' },
                  ].map((badge, idx) => (
                    <View key={idx} style={styles.gloryBadgeCard}>
                      <Award size={24} color="#CCFF00" />
                      <Text style={styles.gloryBadgeTitle}>{badge.title}</Text>
                      <View style={styles.gloryTierPill}>
                        <Text style={styles.gloryTierText}>{badge.tier}</Text>
                      </View>
                      <Text style={styles.gloryBadgeDesc}>{badge.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
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
    paddingBottom: 90,
  },

  /* Hero Profile Card */
  profileHeroCard: {
    backgroundColor: '#080808',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  ssrBadgeWrap: {
    alignItems: 'flex-end',
  },
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
    letterSpacing: 0.5,
  },
  avatarCenterWrap: {
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
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
  heroAvatarImg: {
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fullNameText: {
    fontSize: 18,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  dotSeparator: {
    color: '#64748B',
    fontSize: 11,
  },
  metaSportText: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
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
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },

  /* Edit Profile Button */
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#CCFF00',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.8,
  },

  /* 4-Metrics Grid */
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
  metricBox: {
    flex: 1,
    minWidth: '45%',
    gap: 3,
    padding: 4,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricValWhite: {
    fontSize: 17,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  metricValVolt: {
    fontSize: 17,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },

  /* Scouting Card */
  scoutingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#080808',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  scoutingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flameIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  scoutingTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  scoutingSub: {
    fontSize: 9,
    fontFamily: 'Urbanist_400Regular',
    color: '#64748B',
    marginTop: 2,
  },

  /* Tabs Rail */
  tabsRail: {
    marginHorizontal: -16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  tabBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tabBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Tab Content */
  tabContentContainer: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  bioBodyText: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 18,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  specBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0E0E0E',
    borderRadius: 12,
    padding: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  specValVolt: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  specValWhite: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },

  /* Radar Visual */
  radarContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  radarPolygonOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPolygonMid: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPolygonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
  },
  radarAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  radarTop: { top: 6 },
  radarTopRight: { top: 40, right: 30 },
  radarBottomRight: { bottom: 40, right: 30 },
  radarBottom: { bottom: 6 },
  radarBottomLeft: { bottom: 40, left: 30 },
  radarTopLeft: { top: 40, left: 30 },

  /* Vault Grid */
  vaultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vaultCard: {
    width: '48%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0E0E0E',
    position: 'relative',
  },
  vaultThumb: {
    width: '100%',
    height: '100%',
  },
  vaultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 4,
  },
  vaultTitle: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  vaultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vaultStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vaultStatText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },

  /* Peak Bars */
  peakBarsList: {
    gap: 12,
  },
  peakBarItem: {
    gap: 6,
  },
  peakBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peakBarLabel: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  peakBarVal: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
  },
  peakBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  peakBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Match History Empty State */
  emptyHistoryCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  trophyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    textAlign: 'center',
  },
  emptyHistorySub: {
    fontSize: 11,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  findMatchBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  findMatchBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.5,
  },

  /* Glory Board */
  gloryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gloryBadgeCard: {
    width: '48%',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  gloryBadgeTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    textAlign: 'center',
  },
  gloryTierPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gloryTierText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  gloryBadgeDesc: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
    textAlign: 'center',
  },
});
