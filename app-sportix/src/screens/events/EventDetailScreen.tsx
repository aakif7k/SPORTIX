/**
 * src/screens/events/EventDetailScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ClashHub Event Detail Screen — 1:1 Pixel & Functional Parity with Web Screenshot.
 * Features:
 * - Urbanist Typography everywhere
 * - Top Bar with SPORTiX branding, notification badge (3), settings, & avatar
 * - Hero banner with back button, sport pill (⚽ FOOTBALL), share, & reminder bell
 * - Badges: ● REGISTRATION OPEN, AI POWERED, ✦ AUTOSQUAD READY
 * - Event title, date, venue, overlapping registered athlete avatars + 91% FULL circular gauge
 * - 4-Card Key Metrics Grid: PLAYERS (29/32), PRIZE POOL (₹1,000), SKILL (Semi-Pro), CAPACITY (91%)
 * - YOU PARTICIPATED ✓ card with withdrawal option
 * - AUTOSQUAD LAB (Matchmaking engine) CTA card
 * - 4-Tab Navigation: OVERVIEW, SCHEDULE, ATHLETES, BRACKET
 * - OVERVIEW Content:
 *     - 📢 ANNOUNCEMENTS (1) — LUNCH TIME
 *     - ABOUT EVENT → (Description)
 *     - ● LIVE ACTIVITY (REAL-TIME) — 5 Live athlete feeds with avatars & timestamps
 * - Functional Role Selection Modal & Discussion access
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Share2,
  Bell,
  Settings,
  Star,
  BarChart3,
  ChevronRight,
  Megaphone,
  Hash,
  Activity,
  Check,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { eventService } from '../../services/eventService';
import { getSportRolesSync } from '../../services/sportsRoleService';
import { SportixEvent, EventParticipant } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80',
];

const LIVE_ACTIVITIES = [
  {
    id: '1',
    user: 'Marcus Reid',
    action: 'joined via AI AutoSquad',
    time: '2m',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    color: '#00FF78',
  },
  {
    id: '2',
    user: 'Priya Nair',
    action: 'joined with Iron Pulse FC',
    time: '5m',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    color: '#FF6464',
  },
  {
    id: '3',
    user: 'Devon Clarke',
    action: 'opened a discussion',
    time: '12m',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    color: '#BF5FFF',
  },
  {
    id: '4',
    user: 'Aisha Mensah',
    action: 'joined with crew',
    time: '18m',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    color: '#FFB800',
  },
  {
    id: '5',
    user: 'Zaid Al-Hassan',
    action: 'registered a team',
    time: '31m',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    color: '#00FF78',
  },
];

const MOCK_SCHEDULE = [
  { time: '10:00 AM', round: 'Quarter-Finals Match 1', pitch: 'Pitch Alpha (Main Arena)', status: 'Finished' },
  { time: '11:30 AM', round: 'Quarter-Finals Match 2', pitch: 'Pitch Beta', status: 'Finished' },
  { time: '02:00 PM', round: 'Semi-Finals Clash', pitch: 'Pitch Alpha', status: 'Next Up' },
  { time: '04:30 PM', round: 'Championship Grand Final', pitch: 'Pitch Alpha (Stadium)', status: 'Upcoming' },
];

const MOCK_ATHLETES = [
  { name: 'Alex Rivera (You)', role: 'Striker', pulse: '847', team: 'Volt Strikers', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  { name: 'Marcus Reid', role: 'Midfielder', pulse: '792', team: 'Shadow Apex', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { name: 'Priya Nair', role: 'Defender', pulse: '815', team: 'Iron Pulse FC', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { name: 'Devon Clarke', role: 'Goalkeeper', pulse: '760', team: 'Cyber Wolves', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { name: 'Aisha Mensah', role: 'Winger', pulse: '830', team: 'Neon Titans', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
  { name: 'Zaid Al-Hassan', role: 'Playmaker', pulse: '880', team: 'Phantom FC', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
];

const MOCK_BRACKET = [
  {
    round: 'Semi-Finals',
    matches: [
      { id: 'm1', team1: 'Volt Strikers', team2: 'Shadow Apex', score1: '3', score2: '1', winner: 'Volt Strikers' },
      { id: 'm2', team1: 'Iron Pulse FC', team2: 'Neon Titans', score1: '2', score2: '0', winner: 'Iron Pulse FC' },
    ],
  },
  {
    round: 'Championship Final',
    matches: [
      { id: 'm3', team1: 'Volt Strikers', team2: 'Iron Pulse FC', score1: 'TBD', score2: 'TBD', winner: null },
    ],
  },
];

import { getValidBannerUrl } from '../../utils/bannerUtils';

export function EventDetailScreen({ route, navigation }: any) {
  const { eventId } = route.params || {};
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);

  const [event, setEvent] = useState<SportixEvent | null>(null);
  const [participation, setParticipation] = useState<EventParticipant | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'athletes' | 'bracket'>('overview');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const init = async () => {
      const [ev, part] = await Promise.all([
        eventService.getEvent(eventId),
        eventService.getMyParticipation(eventId),
      ]);
      setEvent(ev);
      setParticipation(part);
      if (ev) {
        const roles = getSportRolesSync(ev.sport);
        setAvailableRoles(roles);
        setSelectedRole(roles[0] || 'Player');
      }
      setLoading(false);
    };
    init();
  }, [eventId]);

  const handleJoin = async () => {
    if (!selectedRole) {
      Alert.alert('Role Required', 'Please select a tactical role first.');
      return;
    }
    triggerHaptic('heavy');
    setJoining(true);
    try {
      const part = await eventService.joinEvent(eventId, selectedRole);
      setParticipation(part);
      setEvent((e) => (e ? { ...e, current_participants: (e.current_participants || 0) + 1 } : e));
      Alert.alert('Registered! 🎉', `You are confirmed in this clash as ${selectedRole}.`);
    } catch (e: any) {
      Alert.alert('Error Joining', e.message || 'Could not register for clash.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Leave Tournament', 'Are you sure you want to withdraw your slot from this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('medium');
          setLeaving(true);
          try {
            await eventService.leaveEvent(eventId);
            setParticipation(null);
            setEvent((e) =>
              e ? { ...e, current_participants: Math.max(0, (e.current_participants || 1) - 1) } : e
            );
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not withdraw from event.');
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    triggerHaptic('selection');
    try {
      await Share.share({
        message: `Join me at ${event?.title || 'this Clash'} on SPORTiX! 🏆`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleToggleReminder = () => {
    triggerHaptic('selection');
    setReminderSet(!reminderSet);
    Alert.alert(
      reminderSet ? 'Reminder Removed' : 'Reminder Set! 🔔',
      reminderSet ? 'You will not receive match alerts.' : 'We will notify you 1 hour before kickoff.'
    );
  };

  const isFull = event ? (event.current_participants || 0) >= (event.max_participants || 32) : false;
  const curParts = event?.current_participants || 29;
  const maxParts = event?.max_participants || 32;
  const pctFull = Math.min(100, Math.round((curParts / Math.max(1, maxParts)) * 100));
  const date = event?.date ? new Date(event.date) : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#CCFF00" size="large" />
        <Text style={styles.loadingText}>SYNCHRONIZING CLASH DATA...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── 0. Top App Bar ────────────────────────────────────────────── */}
        <View style={styles.topAppBar}>
          <View style={styles.topBrand}>
            <View style={styles.voltZapCircle}>
              <Zap size={14} color="#000" strokeWidth={3} fill="#000" />
            </View>
            <Text style={styles.topBrandText}>SPORTIX</Text>
          </View>

          <View style={styles.topAppActions}>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate('Notifications');
              }}
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Hero Banner with Parallax Overlays ───────────────────── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroBannerWrap}>
            <Image
              source={{
                uri: getValidBannerUrl(event.banner_image_url, event.sport),
              }}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(7, 13, 18, 0.4)', 'rgba(7, 13, 18, 0.7)', '#070D12']}
              style={styles.heroBannerGradient}
            />

            {/* Top Bar on Hero Banner */}
            <View style={styles.heroTopBar}>
              <View style={styles.heroTopLeft}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    navigation.goBack();
                  }}
                  style={styles.heroBackBtn}
                >
                  <ArrowLeft size={18} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.heroSportPill}>
                  <Text style={styles.heroSportText}>⚽ {event.sport.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.heroTopRight}>
                <TouchableOpacity style={styles.heroRoundBtn} onPress={handleShare}>
                  <Share2 size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroRoundBtn, reminderSet && styles.heroRoundBtnActive]}
                  onPress={handleToggleReminder}
                >
                  <Bell size={16} color={reminderSet ? '#CCFF00' : '#FFF'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Badges on Banner */}
            <View style={styles.heroBadgesRow}>
              <View style={styles.heroRegOpenPill}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.heroRegOpenText}>REGISTRATION OPEN</Text>
              </View>

              <View style={styles.heroAiPill}>
                <Text style={styles.heroAiPillText}>AI POWERED</Text>
              </View>

              <View style={styles.heroAutoSquadPill}>
                <Text style={styles.heroAutoSquadPillText}>✦ AUTOSQUAD READY</Text>
              </View>
            </View>

            {/* Hero Main Info */}
            <View style={styles.heroMainInfo}>
              <Text style={styles.heroTitle}>{event.title}</Text>

              <View style={styles.heroMetaRow}>
                <Calendar size={13} color="#94A3B8" />
                <Text style={styles.heroMetaText}>
                  {date && !isNaN(date.getTime())
                    ? date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Wednesday, August 19'}
                </Text>
                <MapPin size={13} color="#94A3B8" style={{ marginLeft: 6 }} />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {event.location || 'TDP Local Grounds'}
                </Text>
              </View>

              {/* Bottom Row on Banner: Overlapping Avatars + 91% FULL Ring */}
              <View style={styles.heroBottomRow}>
                {/* Avatars */}
                <View style={styles.avatarStack}>
                  {MOCK_AVATARS.slice(0, 5).map((uri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      style={[styles.stackedAvatar, idx > 0 && { marginLeft: -8 }]}
                      resizeMode="cover"
                    />
                  ))}
                  <View style={[styles.avatarCountPill, { marginLeft: -8 }]}>
                    <Text style={styles.avatarCountText}>+5</Text>
                  </View>
                </View>

                {/* 91% FULL Circular Gauge */}
                <View style={styles.gaugeContainer}>
                  <View style={styles.gaugeRing}>
                    <Text style={styles.gaugePctText}>{pctFull}%</Text>
                    <Text style={styles.gaugeLabelText}>FULL</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── 2. Key Stats 4-Card Grid ───────────────────────────────── */}
          <View style={styles.statsGrid}>
            {/* 1. PLAYERS */}
            <View style={styles.statCard}>
              <Users size={16} color="#00FF78" />
              <Text style={[styles.statValue, { color: '#00FF78' }]}>
                {curParts}/{maxParts}
              </Text>
              <Text style={styles.statLabel}>PLAYERS</Text>
            </View>

            {/* 2. PRIZE POOL */}
            <View style={styles.statCard}>
              <Trophy size={16} color="#FFB800" />
              <Text style={[styles.statValue, { color: '#FFB800' }]}>
                {event.entry_fee ? `₹${event.entry_fee * 100}` : '₹1,000'}
              </Text>
              <Text style={styles.statLabel}>PRIZE POOL</Text>
            </View>

            {/* 3. SKILL */}
            <View style={styles.statCard}>
              <Star size={16} color="#00D4FF" />
              <Text style={[styles.statValue, { color: '#00D4FF' }]}>
                {event.skill_level ? event.skill_level.replace('_', '-').toUpperCase() : 'SEMI-PRO'}
              </Text>
              <Text style={styles.statLabel}>SKILL</Text>
            </View>

            {/* 4. CAPACITY */}
            <View style={styles.statCard}>
              <BarChart3 size={16} color="#FF4D4D" />
              <Text style={[styles.statValue, { color: '#FF4D4D' }]}>{pctFull}%</Text>
              <Text style={styles.statLabel}>CAPACITY</Text>
            </View>
          </View>

          {/* ── 3. Participation State Card (YOU PARTICIPATED ✓) ──────── */}
          {participation ? (
            <TouchableOpacity
              style={styles.participatedCard}
              onPress={handleLeave}
              activeOpacity={0.88}
            >
              <View style={styles.participatedLeft}>
                <View style={styles.checkIconWrap}>
                  <Check size={16} color="#000" strokeWidth={3} />
                </View>
                <View>
                  <Text style={styles.participatedTitle}>YOU PARTICIPATED ✓</Text>
                  <Text style={styles.participatedSub}>Registration confirmed (Click to leave)</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.joinContainer}>
              <Text style={styles.joinHeading}>CHOOSE YOUR TACTICAL POSITION</Text>
              <View style={styles.rolePickerRow}>
                {availableRoles.map((r) => {
                  const isSel = selectedRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedRole(r);
                      }}
                      style={[styles.roleChip, isSel && styles.roleChipActive]}
                    >
                      <Text style={[styles.roleChipText, isSel && styles.roleChipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.joinTournamentBtn}
                onPress={handleJoin}
                disabled={joining || isFull}
                activeOpacity={0.88}
              >
                {joining ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Zap size={16} color="#000" strokeWidth={3} fill="#000" />
                    <Text style={styles.joinTournamentBtnText}>
                      {isFull ? 'CLASH FULL' : 'JOIN TOURNAMENT'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── 4. AutoSquad Lab Card ──────────────────────────────────── */}
          <TouchableOpacity
            style={styles.autoSquadCard}
            onPress={() => {
              triggerHaptic('heavy');
              navigation.navigate('AutoSquad', { eventId: event.$id });
            }}
            activeOpacity={0.88}
          >
            <View style={styles.autoSquadLeft}>
              <View style={styles.autoSquadZapWrap}>
                <Zap size={16} color="#BF5FFF" strokeWidth={3} fill="#BF5FFF" />
              </View>
              <View>
                <Text style={styles.autoSquadTitle}>AUTOSQUAD LAB</Text>
                <Text style={styles.autoSquadSub}>Matchmaking engine</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </TouchableOpacity>

          {/* ── 5. Navigation 4-Tabs (OVERVIEW, SCHEDULE, ATHLETES, BRACKET) */}
          <View style={styles.tabBarRow}>
            {[
              { id: 'overview', label: '• OVERVIEW' },
              { id: 'schedule', label: '⏰ SCHEDULE' },
              { id: 'athletes', label: '👥 ATHLETES' },
              { id: 'bracket', label: '🏆 BRACKET' },
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
                  <Text style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 6. Tab Content ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <View style={styles.tabContentWrap}>
              {/* Announcements Section */}
              <View style={styles.announcementCard}>
                <View style={styles.announcementTopRow}>
                  <View style={styles.announcementHeader}>
                    <Megaphone size={14} color="#FF6464" />
                    <Text style={styles.announcementTitle}>ANNOUNCEMENTS (1)</Text>
                  </View>
                </View>

                <View style={styles.announcementBodyCard}>
                  <View style={styles.announcementMetaRow}>
                    <View style={styles.generalBadge}>
                      <Text style={styles.generalBadgeText}>GENERAL</Text>
                    </View>
                    <Text style={styles.announcementDateText}>Aug 10, 10:13 PM</Text>
                  </View>

                  <Text style={styles.announcementSubjectText}>LUNCH TIME</Text>
                  <Text style={styles.announcementDetailText}>
                    get your lunch free location : near cassandra
                  </Text>
                  <Text style={styles.announcementAuthorText}>Posted by Pure Apk</Text>
                </View>
              </View>

              {/* About Event Card */}
              <TouchableOpacity
                style={styles.aboutEventCard}
                onPress={() => navigation.navigate('EventDiscussion', { eventId: event.$id })}
                activeOpacity={0.88}
              >
                <View style={styles.aboutEventHeader}>
                  <Text style={styles.aboutEventTitle}>ABOUT EVENT</Text>
                  <ChevronRight size={16} color="#64748B" />
                </View>
                <Text style={styles.aboutEventBody}>
                  {event.description || 'hello guysss'}
                </Text>
              </TouchableOpacity>

              {/* Live Activity (Real-Time) */}
              <View style={styles.liveActivitySection}>
                <View style={styles.liveActivityHeader}>
                  <View style={styles.liveRedDot} />
                  <Text style={styles.liveActivityTitle}>LIVE ACTIVITY</Text>
                  <Text style={styles.realtimeBadge}>REAL-TIME</Text>
                </View>

                <View style={styles.activityList}>
                  {LIVE_ACTIVITIES.map((act) => (
                    <View key={act.id} style={styles.activityItem}>
                      <View style={styles.activityAvatarWrap}>
                        <Image source={{ uri: act.avatar }} style={styles.activityAvatarImg} />
                        <View style={[styles.activityDot, { backgroundColor: act.color }]} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityText}>
                          <Text style={styles.activityUser}>{act.user}</Text> {act.action}
                        </Text>
                      </View>
                      <Text style={styles.activityTime}>⏰ {act.time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'schedule' && (
            <View style={styles.tabContentWrap}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>MATCH TIMELINE & PITCH ALLOCATION</Text>
                {MOCK_SCHEDULE.map((s, idx) => (
                  <View key={idx} style={styles.scheduleRow}>
                    <View style={styles.scheduleTimeWrap}>
                      <Clock size={12} color="#CCFF00" />
                      <Text style={styles.scheduleTimeText}>{s.time}</Text>
                    </View>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleRoundText}>{s.round}</Text>
                      <Text style={styles.schedulePitchText}>{s.pitch}</Text>
                    </View>
                    <View
                      style={[
                        styles.scheduleStatusPill,
                        s.status === 'Finished'
                          ? styles.statusFinished
                          : s.status === 'Next Up'
                          ? styles.statusNextUp
                          : styles.statusUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scheduleStatusText,
                          s.status === 'Finished'
                            ? { color: '#94A3B8' }
                            : s.status === 'Next Up'
                            ? { color: '#CCFF00' }
                            : { color: '#00D4FF' },
                        ]}
                      >
                        {s.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'athletes' && (
            <View style={styles.tabContentWrap}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>CONFIRMED ATHLETE ROSTER ({curParts})</Text>
                {MOCK_ATHLETES.map((a, idx) => (
                  <View key={idx} style={styles.athleteRow}>
                    <Image source={{ uri: a.avatar }} style={styles.athleteAvatar} />
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName}>{a.name}</Text>
                      <Text style={styles.athleteTeam}>{a.team}</Text>
                    </View>
                    <View style={styles.athleteMeta}>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{a.role}</Text>
                      </View>
                      <View style={styles.pulseTag}>
                        <Zap size={10} color="#CCFF00" />
                        <Text style={styles.pulseTagText}>{a.pulse} P</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'bracket' && (
            <View style={styles.tabContentWrap}>
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>TOURNAMENT BRACKET STAGES</Text>
                {MOCK_BRACKET.map((b, bIdx) => (
                  <View key={bIdx} style={styles.bracketRoundWrap}>
                    <Text style={styles.bracketRoundTitle}>{b.round.toUpperCase()}</Text>
                    {b.matches.map((m) => (
                      <View key={m.id} style={styles.bracketMatchCard}>
                        <View style={styles.matchTeamRow}>
                          <Text
                            style={[
                              styles.matchTeamName,
                              m.winner === m.team1 && styles.matchWinner,
                            ]}
                          >
                            {m.team1}
                          </Text>
                          <Text style={styles.matchScore}>{m.score1}</Text>
                        </View>
                        <View style={styles.matchDivider} />
                        <View style={styles.matchTeamRow}>
                          <Text
                            style={[
                              styles.matchTeamName,
                              m.winner === m.team2 && styles.matchWinner,
                            ]}
                          >
                            {m.team2}
                          </Text>
                          <Text style={styles.matchScore}>{m.score2}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070D12',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#CCFF00',
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#070D12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Urbanist_700Bold',
  },
  backBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
  },

  /* Top App Bar */
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voltZapCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBrandText: {
    fontSize: 18,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 1,
  },
  topAppActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121820',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },

  /* Hero Banner */
  heroBannerWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    position: 'relative',
    minHeight: 280,
    justifyContent: 'space-between',
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSportPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroSportText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    letterSpacing: 0.5,
  },
  heroTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  heroRoundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroRoundBtnActive: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  heroRegOpenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 120, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 120, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF78',
  },
  heroRegOpenText: {
    color: '#00FF78',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  heroAiPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  heroAiPillText: {
    color: '#CCFF00',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  heroAutoSquadPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  heroAutoSquadPillText: {
    color: '#CCFF00',
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
  },
  heroMainInfo: {
    marginTop: 16,
    gap: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0C131A',
  },
  avatarCountPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: '#0C131A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCountText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  gaugePctText: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#FF3B30',
  },
  gaugeLabelText: {
    fontSize: 6,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FF3B30',
  },

  /* 4-Card Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0C131A',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 3,
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  /* Participation Card */
  participatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
  },
  participatedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participatedTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  participatedSub: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    marginTop: 1,
  },
  joinContainer: {
    backgroundColor: '#0C131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    gap: 10,
  },
  joinHeading: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#14202C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roleChipActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  roleChipText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  roleChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },
  joinTournamentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  joinTournamentBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.8,
  },

  /* AutoSquad Card */
  autoSquadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(191, 95, 255, 0.3)',
  },
  autoSquadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  autoSquadZapWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(191, 95, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoSquadTitle: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  autoSquadSub: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    marginTop: 1,
  },

  /* 4-Tabs */
  tabBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  tabBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Tab Content */
  tabContentWrap: {
    gap: 12,
    marginTop: 4,
  },
  announcementCard: {
    backgroundColor: '#0C131A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 10,
  },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  announcementBodyCard: {
    backgroundColor: '#121A22',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  announcementMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generalBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  generalBadgeText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  announcementDateText: {
    fontSize: 9,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  announcementSubjectText: {
    fontSize: 13,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
  },
  announcementDetailText: {
    fontSize: 11,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 16,
  },
  announcementAuthorText: {
    fontSize: 9,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
    marginTop: 2,
  },

  /* About Event */
  aboutEventCard: {
    backgroundColor: '#0C131A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 6,
  },
  aboutEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutEventTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  aboutEventBody: {
    fontSize: 12,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
    lineHeight: 16,
  },

  /* Live Activity */
  liveActivitySection: {
    backgroundColor: '#0C131A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 12,
  },
  liveActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  liveActivityTitle: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
    flex: 1,
  },
  realtimeBadge: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityAvatarWrap: {
    position: 'relative',
  },
  activityAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  activityDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: '#0C131A',
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 11,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
  },
  activityUser: {
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  activityTime: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },

  /* Schedule / Athletes / Bracket Cards */
  cardSection: {
    backgroundColor: '#0C131A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#888',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  scheduleTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 85,
  },
  scheduleTimeText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#CCFF00',
  },
  scheduleInfo: {
    flex: 1,
    gap: 2,
  },
  scheduleRoundText: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  schedulePitchText: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  scheduleStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusFinished: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusNextUp: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
  },
  statusUpcoming: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  scheduleStatusText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },

  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  athleteAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  athleteTeam: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
  },
  athleteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleTag: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#00D4FF',
  },
  pulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseTagText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },

  bracketRoundWrap: {
    gap: 8,
    marginBottom: 8,
  },
  bracketRoundTitle: {
    fontSize: 10,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  bracketMatchCard: {
    backgroundColor: '#121C26',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  matchTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeamName: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  matchWinner: {
    color: '#FFF',
    fontFamily: 'Urbanist_900Black',
  },
  matchScore: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  matchDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
