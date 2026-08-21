/**
 * src/screens/pulse/BadgesScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Honors & Trophies Showcase — SPORTiX Mobile.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Award, Trophy, Zap, Shield, Sparkles } from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useGamificationStore } from '../../store/gamificationStore';
import { gamificationService } from '../../services/gamificationService';
import { EmptyState } from '../../components/ui/EmptyState';
import { UserBadge } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

const CATEGORIES = ['ALL TROPHIES', 'CLASHES', 'SQUADS', 'STREAKS', 'SPECIAL'];

const MOCK_BADGES = [
  {
    $id: 'b1',
    badge: { name: 'First Victory', description: 'Won your first tournament match.', icon: '🏆', tier: 'Gold' },
    earned_at: '2026-08-10',
  },
  {
    $id: 'b2',
    badge: { name: 'Speed Demon', description: 'Top sprint speed in 5 consecutive matches.', icon: '⚡', tier: 'Diamond' },
    earned_at: '2026-08-12',
  },
  {
    $id: 'b3',
    badge: { name: 'Chemistry Master', description: 'Formed a squad with 90%+ chemistry.', icon: '🧬', tier: 'Platinum' },
    earned_at: '2026-08-14',
  },
  {
    $id: 'b4',
    badge: { name: '7-Day Streaker', description: 'Logged in for 7 straight days.', icon: '🔥', tier: 'Gold' },
    earned_at: '2026-08-15',
  },
  {
    $id: 'b5',
    badge: { name: 'Iron Defender', description: 'Maintained clean sheet in championship final.', icon: '🛡', tier: 'Diamond' },
    earned_at: '2026-08-16',
  },
  {
    $id: 'b6',
    badge: { name: 'Sniper Pulse', description: 'Scored 10+ goals in tournament season.', icon: '🎯', tier: 'Gold' },
    earned_at: '2026-08-17',
  },
];

export function BadgesScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { badges, setBadges, loading, setLoading } = useGamificationStore();
  const [selectedCat, setSelectedCat] = useState('ALL TROPHIES');

  useEffect(() => {
    setLoading(true);
    gamificationService
      .getMyBadges()
      .then((b) => setBadges(b.length > 0 ? b : (MOCK_BADGES as any)))
      .finally(() => setLoading(false));
  }, []);

  const displayBadges = badges.length > 0 ? badges : MOCK_BADGES;

  const renderBadge = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(200, index * 40)).duration(350)}
      style={styles.badgeCol}
    >
      <View style={styles.badgeCard}>
        <View style={styles.badgeIconCircle}>
          <Text style={styles.badgeIconText}>{item.badge?.icon ?? '🏅'}</Text>
        </View>

        <View style={styles.badgeTierPill}>
          <Text style={styles.badgeTierText}>{item.badge?.tier || 'GOLD TIER'}</Text>
        </View>

        <Text style={styles.badgeName}>{item.badge?.name ?? 'Badge Honor'}</Text>
        <Text style={styles.badgeDesc} numberOfLines={2}>
          {item.badge?.description ?? 'Accomplished in competitive clash.'}
        </Text>

        <Text style={styles.earnedDate}>
          Earned {item.earned_at ? new Date(item.earned_at).toLocaleDateString() : 'Aug 2026'}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#000000', '#030508', '#000000']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Top App Bar */}
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
            <Text style={styles.topTitleText}>HONORS & TROPHIES</Text>
            <Text style={styles.topSubText}>ATHLETIC ACHIEVEMENTS</Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{displayBadges.length} UNLOCKED</Text>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSel = selectedCat === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedCat(cat);
                  }}
                >
                  <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>LOADING TROPHY CABINET...</Text>
          </View>
        ) : (
          <FlatList
            data={displayBadges as any}
            keyExtractor={(b) => b.$id}
            renderItem={renderBadge}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="🏆"
                title="NO BADGES UNLOCKED YET"
                subtitle="Complete daily missions and compete in Clashes to unlock honors."
              />
            }
          />
        )}
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
    color: '#FFD54A',
    letterSpacing: 0.8,
  },
  topSubText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 74, 0.25)',
  },
  countPillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFD54A',
  },

  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: '#FFD54A',
    borderColor: '#FFD54A',
  },
  filterChipText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#000',
    fontFamily: 'Urbanist_900Black',
  },

  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFD54A',
    letterSpacing: 0.8,
  },

  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  badgeCol: {
    flex: 1,
  },
  badgeCard: {
    backgroundColor: '#0C131A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 74, 0.25)',
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  badgeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 213, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 213, 74, 0.3)',
  },
  badgeIconText: {
    fontSize: 28,
  },
  badgeTierPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeTierText: {
    fontSize: 7,
    fontFamily: 'Urbanist_900Black',
    color: '#FFD54A',
    letterSpacing: 0.5,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeDesc: {
    fontSize: 10,
    fontFamily: 'Urbanist_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
  },
  earnedDate: {
    fontSize: 8,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
    marginTop: 4,
  },
});
