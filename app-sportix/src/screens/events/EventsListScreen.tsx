/**
 * src/screens/events/EventsListScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ClashHub Mobile — Exact 1:1 Pixel & Functional Parity with SPORTiX Web & Design.
 * Features:
 * - Urbanist Typography everywhere
 * - Top Bar with SPORTiX branding, notification badge (1), settings, & avatar
 * - Hero banner with 3 stacked buttons:
 *     1. + HOST TOURNAMENT (Orange)
 *     2. ⚙ MANAGE MY EVENTS (Volt Green outline)
 *     3. ⚡ MATCH HISTORY (Dark Elevated)
 * - Featured Championship Hero Widescreen Card
 * - Search bar with filter status tabs (ALL EVENTS, UPCOMING, LIVE, COMPLETED)
 * - Horizontal sport pills (🔥 ALL SPORTS, ⚽ FOOTBALL, 🏀 BASKETBALL, etc.)
 * - Tournament cards with dynamic status badges (REGISTRATION OPEN, EVENT COMPLETED, EVENT CANCELLED)
 * - Live capacity progress meters & 100% Urbanist styling
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Settings,
  Bell,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { eventService } from '../../services/eventService';
import { EmptyState } from '../../components/ui/EmptyState';
import { SportixEvent } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { getValidBannerUrl } from '../../utils/bannerUtils';

const SPORT_CATEGORIES = [
  { id: 'All', label: 'ALL SPORTS', emoji: '🔥' },
  { id: 'Football', label: 'FOOTBALL', emoji: '⚽' },
  { id: 'Basketball', label: 'BASKETBALL', emoji: '🏀' },
  { id: 'Cricket', label: 'CRICKET', emoji: '🏏' },
  { id: 'Tennis', label: 'TENNIS', emoji: '🎾' },
  { id: 'Volleyball', label: 'VOLLEYBALL', emoji: '🏐' },
  { id: 'Badminton', label: 'BADMINTON', emoji: '🏸' },
  { id: 'Running', label: 'RUNNING', emoji: '🏃' },
  { id: 'Boxing', label: 'BOXING', emoji: '🥊' },
  { id: 'MMA', label: 'MMA', emoji: '🥋' },
];

const FILTER_TABS = [
  { id: 'all', label: 'ALL EVENTS' },
  { id: 'upcoming', label: 'UPCOMING' },
  { id: 'live', label: 'LIVE' },
  { id: 'completed', label: 'COMPLETED' },
];

export function EventsListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const { events, sportFilter, setSportFilter, setEvents, setLoading, loading } = useEventStore();

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sport = sportFilter === 'All' ? undefined : sportFilter;
      const data = await eventService.getEvents({
        sport,
        limit: 50,
      });
      setEvents(data);
    } catch (e: any) {
      console.warn('[Events] load error:', e);
      setError('Could not load clashes. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sportFilter]);

  useEffect(() => {
    loadEvents();
  }, [sportFilter]);

  const handleRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    loadEvents();
  };

  const handleSelectSport = (sportId: string) => {
    triggerHaptic('selection');
    setSportFilter(sportId);
  };

  const handleSelectStatus = (tabId: any) => {
    triggerHaptic('selection');
    setStatusTab(tabId);
  };

  const filteredEvents = events.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.sport && e.sport.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q));

    const s = (e.status || 'upcoming').toLowerCase();
    let matchesStatus = true;
    if (statusTab === 'upcoming') matchesStatus = s === 'upcoming' || s === 'open';
    else if (statusTab === 'live') matchesStatus = s === 'live' || s === 'ongoing';
    else if (statusTab === 'completed') matchesStatus = s === 'completed' || s === 'ended' || s === 'cancelled';

    return matchesSearch && matchesStatus;
  });

  const featuredEvent = events.find((e) => e.status === 'upcoming') || events[0];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
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
              <Text style={styles.bellBadgeText}>1</Text>
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

      {/* ── 1. Cyberpunk Hero Header Banner ────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.heroCard}>
        <LinearGradient
          colors={['#18202A', '#101720', '#0A0F14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Ambient Top Right Glow */}
          <View style={styles.glowOrb} />

          <View style={styles.heroBadge}>
            <Trophy size={12} color="#FF6B00" />
            <Text style={styles.heroBadgeText}>CLASHHUB LIVE TOURNAMENTS</Text>
          </View>

          <Text style={styles.heroTitle}>
            COMPETE. WIN.{'\n'}
            <Text style={styles.heroTitleGradient}>CLAIM GLORY.</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Discover official sports tournaments, 5-a-side clashes, and pickup events near you. Build your squad, enter brackets, and earn Pulse Points.
          </Text>

          {/* 3 Full-Width Stacked Action Buttons */}
          <View style={styles.heroActionsStacked}>
            {/* 1. + HOST TOURNAMENT */}
            <TouchableOpacity
              style={styles.hostBtnFull}
              onPress={() => {
                triggerHaptic('medium');
                navigation.navigate('CreateEvent');
              }}
              activeOpacity={0.88}
            >
              <Plus size={16} color="#000" strokeWidth={3} />
              <Text style={styles.hostBtnFullText}>+ HOST TOURNAMENT</Text>
            </TouchableOpacity>

            {/* 2. ⚙ MANAGE MY EVENTS */}
            <TouchableOpacity
              style={styles.manageEventsBtnFull}
              onPress={() => {
                triggerHaptic('medium');
                navigation.navigate('ManageEventsDashboard');
              }}
              activeOpacity={0.88}
            >
              <Settings size={15} color="#CCFF00" />
              <Text style={styles.manageEventsBtnFullText}>⚙ MANAGE MY EVENTS</Text>
            </TouchableOpacity>

            {/* 3. ⚡ MATCH HISTORY */}
            <TouchableOpacity
              style={styles.matchHistoryBtnFull}
              onPress={() => {
                triggerHaptic('light');
                navigation.navigate('CoinLedger');
              }}
              activeOpacity={0.88}
            >
              <Activity size={15} color="#94A3B8" />
              <Text style={styles.matchHistoryBtnFullText}>⚡ MATCH HISTORY</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── 2. Featured Championship Hero Card ─────────────────────────── */}
      {featuredEvent && (
        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.featuredWrap}>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => {
              triggerHaptic('light');
              navigation.navigate('EventDetail', { eventId: featuredEvent.$id });
            }}
            activeOpacity={0.92}
          >
            <Image
              source={{
                uri: getValidBannerUrl(featuredEvent.banner_image_url, featuredEvent.sport),
              }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10, 15, 20, 0.7)', '#0A0F14']}
              style={styles.featuredGradient}
            />

            {/* Badges on Banner */}
            <View style={styles.featuredTopRow}>
              <View style={styles.championshipBadge}>
                <Text style={styles.championshipBadgeText}>FEATURED CHAMPIONSHIP</Text>
              </View>
              <View style={styles.regOpenPill}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.regOpenText}>REGISTRATION OPEN</Text>
              </View>
            </View>

            {/* Bottom Info on Hero */}
            <View style={styles.featuredBottomInfo}>
              <View style={styles.featuredMetaRow}>
                <Text style={styles.featuredDateText}>
                  {new Date(featuredEvent.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <MapPin size={12} color="#94A3B8" />
                <Text style={styles.featuredLocationText} numberOfLines={1}>
                  {featuredEvent.location}
                </Text>
              </View>

              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featuredEvent.title}
              </Text>

              {/* Progress & Enter CTA */}
              <View style={styles.featuredProgressRow}>
                <Text style={styles.featuredProgressText}>
                  {featuredEvent.current_participants || 0} / {featuredEvent.max_participants || 32} Registered
                </Text>

                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsOrangeText}>View Details</Text>
                  <ArrowRight size={13} color="#FF6B00" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── 3. Cyberpunk Search & Status Filter Row ───────────────────── */}
      <View style={styles.controlsSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tournaments by name or city..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.statusTabsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.statusTabBtn, isActive && styles.statusTabBtnActive]}
                onPress={() => handleSelectStatus(tab.id)}
              >
                <Text style={[styles.statusTabBtnText, isActive && styles.statusTabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sport Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportsScroll}
        >
          {SPORT_CATEGORIES.map((sport) => {
            const isSel = sportFilter === sport.id;
            const count =
              sport.id === 'All'
                ? events.length
                : events.filter((e) => e.sport?.toLowerCase() === sport.id.toLowerCase()).length;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.sportPillBtn, isSel && styles.sportPillBtnActive]}
                onPress={() => handleSelectSport(sport.id)}
              >
                <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                <Text style={[styles.sportLabel, isSel && styles.sportLabelActive]}>
                  {sport.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderEventCard = ({ item, index }: { item: SportixEvent; index: number }) => {
    const date = item.date ? new Date(item.date) : null;
    const maxParts = item.max_participants || 32;
    const curParts = item.current_participants || 0;
    const pctFull = Math.min(100, Math.round((curParts / Math.max(1, maxParts)) * 100));
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(250, index * 50)).duration(350)}
        layout={Layout.springify()}
        style={styles.cardWrapper}
      >
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            navigation.navigate('EventDetail', { eventId: item.$id });
          }}
          style={styles.tournamentCard}
          activeOpacity={0.88}
        >
          {/* Card Banner Image */}
          <View style={styles.cardBannerWrap}>
            <Image
              source={{
                uri: getValidBannerUrl(item.banner_image_url, item.sport),
              }}
              style={styles.cardBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(12, 19, 26, 0.95)']}
              style={styles.cardBannerGradient}
            />

            {/* Status Badges Matching Screenshot */}
            <View style={styles.cardHeaderBadges}>
              {isCancelled ? (
                <View style={styles.badgeCancelled}>
                  <Text style={styles.badgeCancelledText}>⚠️ ✕ EVENT CANCELLED</Text>
                </View>
              ) : isCompleted ? (
                <View style={styles.badgeCompleted}>
                  <Text style={styles.badgeCompletedText}>✓ EVENT COMPLETED</Text>
                </View>
              ) : (
                <View style={styles.regOpenPill}>
                  <View style={styles.greenLiveDot} />
                  <Text style={styles.regOpenText}>REGISTRATION OPEN</Text>
                </View>
              )}
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Meta Row */}
            <View style={styles.metaRow}>
              <Calendar size={12} color="#FF6B00" />
              <Text style={styles.metaText}>
                {date && !isNaN(date.getTime())
                  ? date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Aug 19'}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location || 'Local Arena'}
              </Text>
              {item.skill_level ? (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.skillLevelPill}>
                    <Text style={styles.skillLevelPillText}>
                      {item.skill_level.toUpperCase().replace('_', '-')}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description || 'No description provided.'}
            </Text>

            {/* Card Footer Progress Bar */}
            <View style={styles.cardFooter}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressCountText}>
                  {isCompleted ? 'Final Participation' : `Filled: ${pctFull}%`}
                </Text>
                <Text
                  style={[
                    styles.progressPctText,
                    { color: isCompleted ? '#94A3B8' : '#FF6B00' },
                  ]}
                >
                  {curParts}/{maxParts} {isCompleted ? 'Athletes' : ''}
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pctFull}%`,
                      backgroundColor: isCompleted ? '#64748B' : '#FF6B00',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {loading && events.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>CONNECTING TO CLASH MATRIX...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Shield size={36} color="#FF4D4D" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadEvents}>
              <Text style={styles.retryBtnText}>RETRY CONNECTION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(e) => e.$id}
            ListHeaderComponent={renderHeader}
            renderItem={renderEventCard}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon="🏆"
                  title="NO CLASHES IN THIS BRACKET"
                  subtitle="Try selecting another sport filter or tap Host Tournament to create the first clash!"
                />
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#CCFF00"
                colors={['#CCFF00', '#FF6B00']}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  /* Top App Bar */
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  /* Hero Card */
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  heroGradient: {
    padding: 20,
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    gap: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#FF6B00',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  heroTitleGradient: {
    color: '#FF6B00',
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 16,
  },
  heroActionsStacked: {
    gap: 10,
  },
  hostBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  hostBtnFullText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.8,
  },
  manageEventsBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.06)',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.35)',
    gap: 8,
  },
  manageEventsBtnFullText: {
    color: '#CCFF00',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.8,
  },
  matchHistoryBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161F28',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  matchHistoryBtnFullText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.8,
  },

  /* Featured Hero */
  featuredWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredCard: {
    height: 220,
    position: 'relative',
    justifyContent: 'space-between',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  championshipBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  championshipBadgeText: {
    color: '#000',
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    letterSpacing: 0.5,
  },
  regOpenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 120, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 120, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF78',
  },
  regOpenText: {
    color: '#00FF78',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    letterSpacing: 0.4,
  },
  featuredBottomInfo: {
    padding: 14,
    gap: 4,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredDateText: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    color: '#CCFF00',
  },
  metaDot: {
    color: '#64748B',
    fontSize: 10,
  },
  featuredLocationText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Urbanist_600SemiBold',
    flex: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  featuredProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  featuredProgressText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Urbanist_600SemiBold',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsOrangeText: {
    color: '#FF6B00',
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
  },

  /* Controls */
  controlsSection: {
    gap: 10,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Urbanist_400Regular',
  },
  statusTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#121820',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  statusTabBtnActive: {
    backgroundColor: '#FF6B00',
  },
  statusTabBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
  },
  statusTabBtnTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },
  sportsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  sportPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  sportPillBtnActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  sportEmoji: {
    fontSize: 13,
  },
  sportLabel: {
    fontSize: 11,
    fontFamily: 'Urbanist_700Bold',
    color: '#94A3B8',
  },
  sportLabelActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  /* Card in List */
  cardWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  tournamentCard: {
    borderRadius: 20,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBannerWrap: {
    height: 140,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardBannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  badgeCompletedText: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  badgeCancelled: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.35)',
  },
  badgeCancelledText: {
    color: '#FF6464',
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Urbanist_600SemiBold',
  },
  skillLevelPill: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  skillLevelPillText: {
    fontSize: 8,
    fontFamily: 'Urbanist_900Black',
    color: '#00D4FF',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
    lineHeight: 16,
  },
  cardFooter: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCountText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Urbanist_600SemiBold',
  },
  progressPctText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Empty / Loader */
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    color: '#CCFF00',
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Urbanist_600SemiBold',
  },
  retryBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
  },
  emptyContainer: {
    padding: 20,
  },
});
