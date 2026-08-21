/**
 * src/screens/pulse/PulseScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX PULSE — 1:1 Parity with Web App Architecture & Screenshots.
 * Features:
 * - Top App Bar with brand, notifications badge, settings, avatar
 * - Header with Level title, AutoSquad AI quick launcher, Pulse PTS pill, streak pill
 * - 4 Interactive Sticky Nav Tabs:
 *    1. [📋 Registered] -> AI Squad Generation Logs, chemistry expanders, workspace navigation
 *    2. [👑 My Level]   -> Semi-circle speedometer gauge, Next Level progress, 3 stat boxes, Level Roadmap
 *    3. [🎁 Rewards]    -> Daily rewards strip, Streak XP multiplier, Day 7 weekly bonus
 *    4. [🎯 Missions]   -> Daily/Weekly switcher, Progress bar, Mission cards with claim triggers
 * - Pure OLED Black (#000000) Cyber Aesthetics with Urbanist typography & haptics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Zap,
  Gift,
  Award,
  Coins,
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Bell,
  Settings,
  Shield,
  Activity,
  Target,
  Crown,
  Lock,
  ClipboardList,
  History,
  CheckCircle2,
  Clock,
  Video,
  Calendar,
  Heart,
  Swords,
  MessageSquare,
  Battery,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { usePulseStore } from '../../store/pulseStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { pulseService } from '../../services/pulseService';
import { gamificationService } from '../../services/gamificationService';
import { triggerHaptic } from '../../utils/haptics';

// ─── LEVEL TIERS ─────────────────────────────────────────────────────────────
const LEVEL_ROADMAP = [
  { level: 10, title: 'Rookie Core', reward: 'Green neon shield, basic border glow' },
  { level: 20, title: 'Challenger Unit', reward: 'Silver chassis, pulse animations, custom badge toggle' },
  { level: 30, title: 'Contender X', reward: 'Layered metal frame, custom light streaks, SSR rating visibility' },
  { level: 40, title: 'Striker Elite', reward: 'Green crystal emblem, motion glow, custom lobby aura' },
  { level: 50, title: 'Elite Phantom', reward: 'Dark chrome chassis, floating holographic shine, squad invite bonus' },
  { level: 60, title: 'Dominator Prime', reward: 'Aggressive neon shape, mini-particle stream, custom status border' },
  { level: 70, title: 'Champion Nexus', reward: 'Prestige trophy design, advanced lighting rays, custom lobby tag' },
  { level: 80, title: 'Titan Core', reward: 'Armored heavy frame, electric pulses, dynamic profile border' },
  { level: 90, title: 'Apex Velocity', reward: 'Dynamic velocity crown, glowing chat bubbles, premium custom color text' },
  { level: 100, title: 'Legend Infinite', reward: 'Prestige aura overlay, moving holographic particles, special nickname prefix' },
];

// ─── INITIAL MISSIONS (MATCHES SCREENSHOT 4) ──────────────────────────────────
const INITIAL_MISSIONS = [
  { id: 'm1', title: 'Upload a Highlight', desc: 'Share 1 sports highlight to your feed', reward: 20, current: 0, target: 1, completed: false, category: 'daily', icon: 'video' },
  { id: 'm2', title: 'Join an Event', desc: 'Register for 1 upcoming event', reward: 30, current: 0, target: 1, completed: false, category: 'daily', icon: 'calendar' },
  { id: 'm3', title: 'React to Posts', desc: 'Like or react to 5 posts in the feed', reward: 15, current: 0, target: 5, completed: false, category: 'daily', icon: 'heart' },
  { id: 'm4', title: 'Complete a Match', desc: 'Finish 1 full match in PULSE mode', reward: 40, current: 0, target: 1, completed: false, category: 'daily', icon: 'swords' },
  { id: 'm5', title: 'Message Teammates', desc: 'Send messages to 3 teammates', reward: 10, current: 0, target: 3, completed: false, category: 'daily', icon: 'message' },
  { id: 'm6', title: 'Earn 50 Pulse', desc: 'Accumulate 50 Pulse from any activities', reward: 25, current: 0, target: 50, completed: false, category: 'daily', icon: 'battery' },
  { id: 'm7', title: 'Win 3 Tournament Clashes', desc: 'Achieve victory in 3 tournament clashes this week', reward: 100, current: 1, target: 3, completed: false, category: 'weekly', icon: 'swords' },
  { id: 'm8', title: 'Squad Chemistry Boost', desc: 'Play 2 matches with 80%+ team chemistry', reward: 75, current: 0, target: 2, completed: false, category: 'weekly', icon: 'zap' },
];

// ─── MOCK SQUADS FOR REGISTERED TAB (MATCHES SCREENSHOT 1) ───────────────────
const MOCK_SQUADS = [
  {
    id: 'sq_1',
    name: 'ACT 98D575',
    sport: 'FOOTBALL',
    date: '2026-08-03T10:49:37.518+00:00',
    matchPct: 88,
    status: 'ACTIVE',
    chemistry: { overall: 50, trust: 85, coordination: 90, communication: 78 },
    members: [
      { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', position: 'ST', level: 14, compatibility: 92, distance: 1.8 },
      { name: 'Marcus Reid', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', position: 'CM', level: 12, compatibility: 88, distance: 3.2 },
      { name: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', position: 'CB', level: 15, compatibility: 85, distance: 2.5 },
      { name: 'Devon Clarke', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', position: 'GK', level: 11, compatibility: 80, distance: 4.1 },
    ],
  },
  {
    id: 'sq_2',
    name: 'WIRED 279DBE',
    sport: 'FOOTBALL',
    date: '2026-08-03T06:32:47.844+00:00',
    matchPct: 88,
    status: 'ACTIVE',
    chemistry: { overall: 50, trust: 82, coordination: 88, communication: 75 },
    members: [
      { name: 'Aisha Mensah', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80', position: 'LW', level: 16, compatibility: 90, distance: 2.0 },
      { name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80', position: 'RW', level: 13, compatibility: 86, distance: 3.8 },
    ],
  },
  {
    id: 'sq_3',
    name: 'HERITAGE XI',
    sport: 'CRICKET',
    date: '2026-07-30T14:03:84.200+00:00',
    matchPct: 42,
    status: 'ACTIVE',
    chemistry: { overall: 50, trust: 75, coordination: 70, communication: 65 },
    members: [
      { name: 'Rohan Sharma', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80', position: 'BAT', level: 10, compatibility: 78, distance: 4.5 },
      { name: 'Kavita Patel', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80', position: 'BOWL', level: 9, compatibility: 72, distance: 5.0 },
    ],
  },
];

export function PulseScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const { pulseScore, setPulseScore } = usePulseStore();
  const { streakDays, setStreakDays } = useGamificationStore();

  const [activeTab, setActiveTab] = useState<'registered' | 'level' | 'rewards' | 'missions'>('registered');
  const [missionCategory, setMissionCategory] = useState<'daily' | 'weekly'>('daily');
  const [expandedSquadId, setExpandedSquadId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [localMissions, setLocalMissions] = useState(INITIAL_MISSIONS);
  const [claimedDays, setClaimedDays] = useState<number[]>([1]);

  const currentPulse = profile?.pulse_score ?? pulseScore?.score ?? 125;
  const currentLevel = profile?.level ?? 2;
  const currentStreak = streakDays || 2;

  // Level Calculations
  const levelTitle = currentLevel <= 10 ? 'Rookie' : currentLevel <= 20 ? 'Challenger' : 'Pro Elite';
  const levelPercentage = 25;
  const remainingPts = 75;

  const loadData = async () => {
    try {
      const [ps, streak] = await Promise.all([
        pulseService.getMyPulse(),
        gamificationService.getStreakInfo(),
      ]);
      if (ps) setPulseScore(ps);
      if (streak?.days !== undefined) setStreakDays(streak.days);
    } catch {
      // Ignored
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    loadData();
  };

  const toggleSquadAccordion = (id: string) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSquadId(expandedSquadId === id ? null : id);
  };

  const handleClaimReward = (day: number) => {
    if (claimedDays.includes(day)) return;
    triggerHaptic('heavy');
    setClaimedDays([...claimedDays, day]);
    Alert.alert('Reward Claimed! ⚡', `You received +${day === 1 ? 10 : day === 2 ? 15 : 20} Pulse Points.`);
  };

  const handleClaimMission = (id: string, reward: number) => {
    triggerHaptic('heavy');
    setLocalMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: true, current: m.target } : m))
    );
    Alert.alert('Mission Completed! 🎯', `You earned +${reward} ⚡ Pulse Points.`);
  };

  const filteredMissions = localMissions.filter((m) => m.category === missionCategory);
  const completedMissionsCount = filteredMissions.filter((m) => m.completed).length;
  const totalAvailableReward = filteredMissions
    .filter((m) => !m.completed)
    .reduce((acc, cur) => acc + cur.reward, 0);

  const renderMissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'video':
        return <Video size={16} color="#94A3B8" />;
      case 'calendar':
        return <Calendar size={16} color="#94A3B8" />;
      case 'heart':
        return <Zap size={16} color="#CCFF00" />;
      case 'swords':
        return <Swords size={16} color="#FF4D4D" />;
      case 'message':
        return <MessageSquare size={16} color="#00D4FF" />;
      case 'battery':
        return <Battery size={16} color="#00FF78" />;
      default:
        return <Target size={16} color="#CCFF00" />;
    }
  };

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#CCFF00"
            />
          }
        >
          {/* ── 1. Page Header Block ─────────────────────────────────────── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pulseHeading}>
              SPORTi<Text style={styles.voltText}>X</Text> PULSE
            </Text>
            <Text style={styles.pulseSubHeading}>
              Your squad ecosystem · Level {currentLevel} · ⚡ {levelTitle}
            </Text>

            {/* Quick Action & Stats Row */}
            <View style={styles.quickStatsRow}>
              <TouchableOpacity
                style={styles.autoSquadBtn}
                onPress={() => {
                  triggerHaptic('heavy');
                  navigation.navigate('AutoSquad');
                }}
                activeOpacity={0.88}
              >
                <Zap size={14} color="#CCFF00" strokeWidth={2.5} fill="#CCFF00" />
                <Text style={styles.autoSquadBtnText}>AutoSquad AI</Text>
              </TouchableOpacity>

              <View style={styles.statPill}>
                <Text style={styles.statPillVolt}>{currentPulse}</Text>
                <Text style={styles.statPillLabel}>PTS</Text>
              </View>

              <View style={styles.statPillOrange}>
                <Text style={styles.statPillOrangeText}>🔥 {currentStreak}</Text>
                <Text style={styles.statPillLabel}>streak</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Horizontal Nav Tabs Rail ──────────────────────────────── */}
          <View style={styles.tabsRail}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {[
                { id: 'registered', label: 'Registered', icon: <ClipboardList size={13} color={activeTab === 'registered' ? '#000' : '#94A3B8'} /> },
                { id: 'level',      label: 'My Level',   icon: <Crown size={13} color={activeTab === 'level' ? '#000' : '#94A3B8'} /> },
                { id: 'rewards',    label: 'Rewards',    icon: <Gift size={13} color={activeTab === 'rewards' ? '#000' : '#94A3B8'} /> },
                { id: 'missions',   label: 'Missions',   icon: <Target size={13} color={activeTab === 'missions' ? '#000' : '#94A3B8'} /> },
              ].map((tab) => {
                const isSel = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabBtn, isSel && styles.tabBtnActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab.id as any);
                    }}
                  >
                    {tab.icon}
                    <Text style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 3. Tab Content ───────────────────────────────────────────── */}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 1: [📋 Registered] — AI Squad Generation Logs
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'registered' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContainer}>
              <View style={styles.sectionHeaderRow}>
                <History size={16} color="#CCFF00" />
                <Text style={styles.sectionTitleText}>AI SQUAD GENERATION LOGS</Text>
              </View>

              <View style={styles.squadsList}>
                {MOCK_SQUADS.map((squad) => {
                  const isExpanded = expandedSquadId === squad.id;
                  return (
                    <View key={squad.id} style={styles.squadCard}>
                      {/* Squad Header */}
                      <View style={styles.squadHeaderTop}>
                        <View style={styles.squadTitleLeft}>
                          <Text style={styles.squadName}>{squad.name}</Text>
                          <View style={styles.sportBadge}>
                            <Text style={styles.sportBadgeText}>{squad.sport}</Text>
                          </View>
                        </View>

                        <View style={styles.statusActivePill}>
                          <Text style={styles.statusActiveText}>{squad.status}</Text>
                        </View>
                      </View>

                      {/* Timestamp & Match Rating */}
                      <Text style={styles.timestampText}>
                        Generated: {squad.date}
                      </Text>

                      <Text style={styles.matchPctText}>{squad.matchPct}% Match</Text>

                      {/* Member Avatars & Accordion Trigger */}
                      <TouchableOpacity
                        style={styles.chemistryRowTrigger}
                        onPress={() => toggleSquadAccordion(squad.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.avatarsRow}>
                          {squad.members.map((m, idx) => (
                            <Image
                              key={idx}
                              source={{ uri: m.avatar }}
                              style={[
                                styles.memberAvatarImg,
                                { marginLeft: idx === 0 ? 0 : -8 },
                              ]}
                            />
                          ))}
                        </View>

                        <View style={styles.chemistryRight}>
                          <Text style={styles.chemistryLabel}>
                            Chemistry: <Text style={styles.chemistryBold}>{squad.chemistry.overall}%</Text>
                          </Text>
                          <ChevronDown
                            size={14}
                            color="#94A3B8"
                            style={{
                              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                            }}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Expandable Accordion Body */}
                      {isExpanded && (
                        <View style={styles.accordionDetails}>
                          {/* 3 Telemetry Metrics */}
                          <View style={styles.telemetryGrid}>
                            <View style={styles.telemetryBox}>
                              <Text style={styles.telemetryLabel}>TRUST</Text>
                              <Text style={styles.telemetryValVolt}>{squad.chemistry.trust}%</Text>
                            </View>
                            <View style={styles.telemetryBox}>
                              <Text style={styles.telemetryLabel}>COORD</Text>
                              <Text style={styles.telemetryValCyan}>{squad.chemistry.coordination}%</Text>
                            </View>
                            <View style={styles.telemetryBox}>
                              <Text style={styles.telemetryLabel}>COMM</Text>
                              <Text style={styles.telemetryValPlasma}>{squad.chemistry.communication}%</Text>
                            </View>
                          </View>

                          {/* Member Listing */}
                          <View style={styles.membersDetailList}>
                            <Text style={styles.subHeading}>TEAM PARTICIPANTS</Text>
                            {squad.members.map((member, i) => (
                              <View key={i} style={styles.memberDetailItem}>
                                <Image source={{ uri: member.avatar }} style={styles.miniAvatar} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.memberName}>{member.name}</Text>
                                  <Text style={styles.memberSub}>
                                    {member.position} · Level {member.level}
                                  </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={styles.compatText}>{member.compatibility}%</Text>
                                  <Text style={styles.distanceText}>{member.distance} KM</Text>
                                </View>
                              </View>
                            ))}
                          </View>

                          {/* Access Squad Button */}
                          <TouchableOpacity
                            style={styles.accessSquadBtn}
                            onPress={() => {
                              triggerHaptic('medium');
                              navigation.navigate('SquadLocker', { squadId: squad.id });
                            }}
                          >
                            <Text style={styles.accessSquadBtnText}>ACCESS SQUAD WORKSPACE</Text>
                            <ArrowRight size={14} color="#000" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* View Full History Button */}
              <TouchableOpacity
                style={styles.viewHistoryBtn}
                onPress={() => {
                  triggerHaptic('medium');
                  navigation.navigate('AutoSquad');
                }}
              >
                <Text style={styles.viewHistoryBtnText}>VIEW FULL SQUAD GENERATION HISTORY</Text>
                <ArrowRight size={14} color="#CCFF00" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 2: [👑 My Level] — Speedometer & Level Roadmap
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'level' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContainer}>
              <View style={styles.levelHeroCard}>
                {/* Header */}
                <View style={styles.levelCardTop}>
                  <View style={styles.levelCardIconWrap}>
                    <Crown size={18} color="#CCFF00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.levelCardTitle}>SPORTIX LEVEL</Text>
                      <View style={styles.seasonBadge}>
                        <Text style={styles.seasonBadgeText}>SEASON 1</Text>
                      </View>
                    </View>
                    <Text style={styles.levelCardSub}>Your progression in the SPORTIX ecosystem</Text>
                  </View>
                </View>

                {/* Semi-Circle Level Dial / Speedometer */}
                <View style={styles.dialContainer}>
                  <View style={styles.dialOuterRing}>
                    <View style={styles.dialShieldIcon}>
                      <Shield size={38} color="#CCFF00" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.dialScoreNumber}>{currentPulse}</Text>
                    <Text style={styles.dialScoreLabel}>PULSE</Text>
                    <Text style={styles.dialSubText}>Rookie {levelPercentage}%</Text>
                  </View>

                  <View style={styles.dialScaleRow}>
                    <Text style={styles.dialScaleText}>25 PTS</Text>
                    <Text style={styles.dialScaleText}>100 PTS</Text>
                  </View>

                  <View style={styles.levelRookiePill}>
                    <Shield size={12} color="#CCFF00" />
                    <Text style={styles.levelRookiePillText}>LVL {currentLevel} · ROOKIE</Text>
                  </View>
                </View>

                {/* Next Level Info Card */}
                <View style={styles.nextLevelCard}>
                  <View style={styles.nextLevelHeader}>
                    <View>
                      <Text style={styles.nextLevelLabel}>NEXT LEVEL</Text>
                      <Text style={styles.nextLevelTitle}>⚡ {levelTitle}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.nextLevelLabel}>Remaining</Text>
                      <Text style={styles.remainingPtsNumber}>{remainingPts}</Text>
                      <Text style={styles.remainingPtsLabel}>PULSE PTS</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressRowLabels}>
                    <Text style={styles.progressLabelText}>LVL {currentLevel}</Text>
                    <Text style={styles.progressLabelText}>{levelPercentage}% complete</Text>
                    <Text style={styles.progressLabelText}>LVL {currentLevel + 1}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${levelPercentage}%` }]} />
                  </View>
                </View>

                {/* 3 Stat Boxes Grid */}
                <View style={styles.threeStatsGrid}>
                  <View style={styles.threeStatBox}>
                    <Text style={[styles.threeStatVal, { color: '#BF5FFF' }]}>0</Text>
                    <Text style={styles.threeStatLabel}>TOTAL XP</Text>
                  </View>
                  <View style={styles.threeStatBox}>
                    <Text style={[styles.threeStatVal, { color: '#FF6B00' }]}>{currentStreak}d 🔥</Text>
                    <Text style={styles.threeStatLabel}>STREAK</Text>
                  </View>
                  <View style={styles.threeStatBox}>
                    <Text style={[styles.threeStatVal, { color: '#CCFF00' }]}>#{currentLevel}</Text>
                    <Text style={styles.threeStatLabel}>LEVEL</Text>
                  </View>
                </View>

                {/* SPORTIX LEVEL ROADMAP */}
                <View style={styles.roadmapSection}>
                  <View style={styles.roadmapHeader}>
                    <Text style={styles.roadmapTitle}>SPORTIX LEVEL ROADMAP</Text>
                    <Text style={styles.roadmapSub}>Milestone rewards every 10 levels</Text>
                  </View>

                  <View style={styles.roadmapList}>
                    {LEVEL_ROADMAP.map((item) => {
                      const isUnlocked = currentLevel >= item.level;
                      return (
                        <View
                          key={item.level}
                          style={[
                            styles.roadmapItem,
                            isUnlocked ? styles.roadmapItemUnlocked : styles.roadmapItemLocked,
                          ]}
                        >
                          <View style={styles.roadmapIconWrap}>
                            <Shield size={20} color={isUnlocked ? '#CCFF00' : '#64748B'} />
                            {!isUnlocked && (
                              <View style={styles.lockOverlay}>
                                <Lock size={10} color="#94A3B8" />
                              </View>
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={styles.roadmapItemTop}>
                              <Text style={styles.roadmapItemTitle}>{item.title}</Text>
                              <Text style={styles.roadmapItemLevel}>LVL {item.level}</Text>
                            </View>
                            <Text style={styles.roadmapItemReward}>{item.reward}</Text>
                            {isUnlocked && (
                              <View style={styles.unlockedBadge}>
                                <Text style={styles.unlockedBadgeText}>UNLOCKED</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 3: [🎁 Rewards] — Daily Rewards & Streaks
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'rewards' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContainer}>
              <View style={styles.rewardsHeroCard}>
                {/* Header */}
                <View style={styles.levelCardTop}>
                  <View style={[styles.levelCardIconWrap, { backgroundColor: 'rgba(255, 107, 0, 0.15)', borderColor: 'rgba(255, 107, 0, 0.3)' }]}>
                    <Gift size={18} color="#FF6B00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.levelCardTitle}>DAILY REWARDS</Text>
                      <View style={styles.dailyBadge}>
                        <Text style={styles.dailyBadgeText}>DAILY</Text>
                      </View>
                    </View>
                    <Text style={styles.levelCardSub}>{currentStreak} day login streak — keep going!</Text>
                  </View>
                </View>

                {/* Streak Bonus Banner */}
                <View style={styles.streakBanner}>
                  <View style={styles.streakBannerLeft}>
                    <Flame size={24} color="#FF6B00" />
                    <View>
                      <Text style={styles.streakBannerTitle}>{currentStreak} Day Streak!</Text>
                      <Text style={styles.streakBannerSub}>Keep logging in daily to maintain your bonus</Text>
                    </View>
                  </View>
                  <Text style={styles.streakBonusMultiplier}>+10% XP</Text>
                </View>

                {/* Daily Reward Cards Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dailyStripScroll}
                >
                  {[
                    { day: 1, pulse: 10, icon: <Zap size={22} color="#CCFF00" /> },
                    { day: 2, pulse: 15, icon: <Zap size={22} color="#CCFF00" /> },
                    { day: 3, pulse: 20, icon: <Battery size={22} color="#00FF78" /> },
                    { day: 4, pulse: 25, icon: <Zap size={22} color="#00D4FF" /> },
                    { day: 5, pulse: 30, icon: <Zap size={22} color="#BF5FFF" /> },
                    { day: 6, pulse: 40, icon: <Zap size={22} color="#FFB800" /> },
                    { day: 7, pulse: 100, icon: <Crown size={22} color="#FFD700" /> },
                  ].map((d) => {
                    const isClaimed = claimedDays.includes(d.day);
                    return (
                      <View key={d.day} style={[styles.dailyCard, isClaimed && styles.dailyCardClaimed]}>
                        <Text style={styles.dailyCardDayLabel}>DAY {d.day}</Text>
                        <View style={styles.dailyCardIcon}>{d.icon}</View>
                        <Text style={styles.dailyCardPulseVal}>+{d.pulse}</Text>
                        <Text style={styles.dailyCardPulseLabel}>PULSE</Text>
                        {isClaimed ? (
                          <View style={styles.claimedPill}>
                            <Text style={styles.claimedPillText}>CLAIMED ✓</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.claimNowBtn}
                            onPress={() => handleClaimReward(d.day)}
                          >
                            <Text style={styles.claimNowBtnText}>CLAIM</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Day 7 Weekly Bonus Card */}
                <View style={styles.weeklyBonusCard}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weeklyBonusTitle}>Day 7 Weekly Bonus</Text>
                    <Text style={styles.weeklyBonusSub}>+100 Pulse · 2x XP Booster · Exclusive Title</Text>
                  </View>
                  <View style={styles.weeklyBonusLock}>
                    <Lock size={12} color="#94A3B8" />
                    <Text style={styles.weeklyBonusLockText}>{7 - currentStreak}d left</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 4: [🎯 Missions] — Missions Terminal
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'missions' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContainer}>
              <View style={styles.missionsHeroCard}>
                {/* Header */}
                <View style={styles.levelCardTop}>
                  <View style={styles.levelCardIconWrap}>
                    <Target size={18} color="#CCFF00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.levelCardTitle}>MISSIONS</Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.levelCardSub}>Complete missions to earn Pulse & XP</Text>
                  </View>
                </View>

                {/* Daily / Weekly Switcher & Available Badge */}
                <View style={styles.missionsFilterRow}>
                  <View style={styles.switcherGroup}>
                    <TouchableOpacity
                      style={[styles.switcherBtn, missionCategory === 'daily' && styles.switcherBtnActive]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setMissionCategory('daily');
                      }}
                    >
                      <Text style={[styles.switcherBtnText, missionCategory === 'daily' && styles.switcherBtnTextActive]}>
                        DAILY
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.switcherBtn, missionCategory === 'weekly' && styles.switcherBtnActive]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setMissionCategory('weekly');
                      }}
                    >
                      <Text style={[styles.switcherBtnText, missionCategory === 'weekly' && styles.switcherBtnTextActive]}>
                        WEEKLY
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.availablePill}>
                    <Zap size={10} color="#CCFF00" />
                    <Text style={styles.availablePillText}>+{totalAvailableReward} available</Text>
                  </View>
                </View>

                {/* Progress Bar Summary */}
                <View style={styles.progressSummaryCard}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.progressSummaryLabel}>Progress</Text>
                      <Text style={styles.progressSummaryCount}>
                        {completedMissionsCount}/{filteredMissions.length} completed
                      </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${
                              filteredMissions.length > 0
                                ? (completedMissionsCount / filteredMissions.length) * 100
                                : 0
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.progressSummaryPct}>
                    {Math.round(
                      filteredMissions.length > 0
                        ? (completedMissionsCount / filteredMissions.length) * 100
                        : 0
                    )}%
                  </Text>
                </View>

                {/* Missions List */}
                <View style={styles.missionsCardsList}>
                  {filteredMissions.map((mission) => (
                    <View
                      key={mission.id}
                      style={[
                        styles.missionItemCard,
                        mission.completed && styles.missionItemCompleted,
                      ]}
                    >
                      <View style={styles.missionIconSquare}>
                        {renderMissionIcon(mission.icon)}
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.missionTitle,
                            mission.completed && styles.missionTitleDone,
                          ]}
                        >
                          {mission.title}
                        </Text>
                        <Text style={styles.missionDesc}>{mission.desc}</Text>
                        <Text style={styles.missionFraction}>
                          {mission.current}/{mission.target}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={styles.missionRewardPill}>
                          <Text style={styles.missionRewardText}>+{mission.reward} ⚡</Text>
                        </View>

                        {mission.completed ? (
                          <CheckCircle2 size={16} color="#00FF78" />
                        ) : (
                          <TouchableOpacity
                            style={styles.claimMissionBtn}
                            onPress={() => handleClaimMission(mission.id, mission.reward)}
                          >
                            <Text style={styles.claimMissionBtnText}>COMPLETE</Text>
                          </TouchableOpacity>
                        )}
                      </View>
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
    paddingBottom: 90,
  },

  /* Page Header Block */
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
  },
  pulseHeading: {
    fontSize: 26,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 1,
  },
  voltText: {
    color: '#CCFF00',
  },
  pulseSubHeading: {
    fontSize: 11,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    marginBottom: 8,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
  },
  autoSquadBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statPillVolt: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  statPillLabel: {
    fontSize: 9,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  statPillOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  statPillOrangeText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },

  /* Horizontal Tabs Rail */
  tabsRail: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#000',
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  tabContainer: {
    padding: 16,
    gap: 14,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitleText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 1,
  },

  /* Squads List */
  squadsList: {
    gap: 12,
  },
  squadCard: {
    backgroundColor: '#080808',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  squadHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadName: {
    fontSize: 15,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  sportBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  statusActivePill: {
    backgroundColor: 'rgba(0, 255, 120, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 120, 0.3)',
  },
  statusActiveText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#00FF78',
  },
  timestampText: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  matchPctText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    marginTop: 2,
  },
  chemistryRowTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
    marginTop: 4,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#080808',
  },
  chemistryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chemistryLabel: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
  chemistryBold: {
    color: '#FFF',
    fontFamily: 'Urbanist_900Black',
  },

  /* Accordion */
  accordionDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
    gap: 10,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryBox: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  telemetryValVolt: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    marginTop: 2,
  },
  telemetryValCyan: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#00D4FF',
    marginTop: 2,
  },
  telemetryValPlasma: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#BF5FFF',
    marginTop: 2,
  },
  membersDetailList: {
    gap: 6,
  },
  subHeading: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  memberDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  memberName: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  memberSub: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  compatText: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  distanceText: {
    fontSize: 7,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },
  accessSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  accessSquadBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
    letterSpacing: 0.5,
  },
  viewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    gap: 6,
  },
  viewHistoryBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },

  /* Level Hero Card */
  levelHeroCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  levelCardTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  seasonBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  seasonBadgeText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  levelCardSub: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },

  /* Dial Speedometer */
  dialContainer: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  dialOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
    shadowColor: '#CCFF00',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    gap: 2,
  },
  dialShieldIcon: {
    marginBottom: -4,
  },
  dialScoreNumber: {
    fontSize: 34,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    lineHeight: 36,
  },
  dialScoreLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
    letterSpacing: 1,
  },
  dialSubText: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
  dialScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 160,
  },
  dialScaleText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  levelRookiePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  levelRookiePillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },

  /* Next Level Card */
  nextLevelCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  nextLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextLevelLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  nextLevelTitle: {
    fontSize: 14,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    marginTop: 2,
  },
  remainingPtsNumber: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  remainingPtsLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  progressRowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 3,
  },

  /* 3 Stats Grid */
  threeStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  threeStatBox: {
    flex: 1,
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  threeStatVal: {
    fontSize: 14,
    fontFamily: 'Urbanist_900Black',
  },
  threeStatLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  /* Roadmap Section */
  roadmapSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
    gap: 10,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roadmapTitle: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  roadmapSub: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  roadmapList: {
    gap: 8,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
  },
  roadmapItemUnlocked: {
    backgroundColor: '#0E0E0E',
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  roadmapItemLocked: {
    backgroundColor: '#0A0A0A',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.6,
  },
  roadmapIconWrap: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roadmapItemTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  roadmapItemLevel: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  roadmapItemReward: {
    fontSize: 8,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    marginTop: 2,
  },
  unlockedBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
  },
  unlockedBadgeText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },

  /* Rewards Hero Card */
  rewardsHeroCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dailyBadgeText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  streakBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  streakBannerTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  streakBannerSub: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  streakBonusMultiplier: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#FF6B00',
  },
  dailyStripScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  dailyCard: {
    width: 90,
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 4,
  },
  dailyCardClaimed: {
    borderColor: 'rgba(0, 255, 120, 0.3)',
    backgroundColor: 'rgba(0, 255, 120, 0.04)',
  },
  dailyCardDayLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  dailyCardIcon: {
    marginVertical: 4,
  },
  dailyCardPulseVal: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  dailyCardPulseLabel: {
    fontSize: 7,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  claimedPill: {
    backgroundColor: 'rgba(0, 255, 120, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  claimedPillText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#00FF78',
  },
  claimNowBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  claimNowBtnText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
  },
  weeklyBonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    gap: 10,
  },
  crownEmoji: {
    fontSize: 22,
  },
  weeklyBonusTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  weeklyBonusSub: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  weeklyBonusLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weeklyBonusLockText: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },

  /* Missions Hero Card */
  missionsHeroCard: {
    backgroundColor: '#080808',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  activeBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  missionsFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switcherGroup: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  switcherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switcherBtnActive: {
    backgroundColor: '#CCFF00',
  },
  switcherBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  switcherBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E0E0E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  availablePillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  progressSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  progressSummaryLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  progressSummaryCount: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  progressSummaryPct: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  missionsCardsList: {
    gap: 10,
  },
  missionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  missionItemCompleted: {
    borderColor: 'rgba(0, 255, 120, 0.25)',
    backgroundColor: 'rgba(0, 255, 120, 0.04)',
  },
  missionIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  missionTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  missionDesc: {
    fontSize: 9,
    fontFamily: 'Urbanist_400Regular',
    color: '#64748B',
  },
  missionFraction: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
    marginTop: 2,
  },
  missionRewardPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missionRewardText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  claimMissionBtn: {
    backgroundColor: '#121212',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  claimMissionBtnText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
});
