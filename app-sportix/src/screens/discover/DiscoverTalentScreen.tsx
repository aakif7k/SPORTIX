/**
 * src/screens/discover/DiscoverTalentScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Discover & Athlete Radar — SPORTiX Mobile.
 * Features:
 * - Top App Bar with Radar branding
 * - Real-time Athlete Search Bar
 * - Multi-Sport Category Filter Chips
 * - Competitive Skill Tier Filters (Amateur, Semi-Pro, Pro, Elite)
 * - Cyberpunk Athlete Cards with Pulse Scores & Direct Challenge CTAs
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  Zap,
  ArrowLeft,
  Filter,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { profileService } from '../../services/profileService';
import { UserProfile } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { triggerHaptic } from '../../utils/haptics';

const SPORT_FILTERS = ['All', 'Football', 'Basketball', 'Cricket', 'Tennis', 'Volleyball'];
const TIER_FILTERS = ['All Tiers', 'Amateur', 'Semi-Pro', 'Pro', 'Elite'];

const MOCK_ATHLETES: UserProfile[] = [
  {
    $id: 'ath_1',
    full_name: 'Marcus Reid',
    username: 'marcus_reid',
    email: 'marcus@sportix.io',
    role: 'athlete',
    sport: 'Football',
    sports: ['Football', 'Futsal'],
    experience_level: 'semi_pro',
    location: 'Chennai, India',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    bio: 'Attacking Midfielder with 10+ years competitive experience.',
    is_open_to_recruit: true,
    is_active: true,
    is_onboarding_complete: true,
    pulse_score: 885,
    level: 15,
    coins_balance: 1400,
    login_streak: 7,
  },
  {
    $id: 'ath_2',
    full_name: 'Priya Nair',
    username: 'priya_nair',
    email: 'priya@sportix.io',
    role: 'athlete',
    sport: 'Basketball',
    sports: ['Basketball'],
    experience_level: 'pro',
    location: 'Bangalore, India',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
    bio: 'Point guard with high spatial vision.',
    is_open_to_recruit: true,
    is_active: true,
    is_onboarding_complete: true,
    pulse_score: 912,
    level: 18,
    coins_balance: 2200,
    login_streak: 12,
  },
  {
    $id: 'ath_3',
    full_name: 'Devon Clarke',
    username: 'devon_clarke',
    email: 'devon@sportix.io',
    role: 'athlete',
    sport: 'Football',
    sports: ['Football'],
    experience_level: 'semi_pro',
    location: 'Mumbai, India',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    bio: 'Shot stopper & defense commander.',
    is_open_to_recruit: false,
    is_active: true,
    is_onboarding_complete: true,
    pulse_score: 790,
    level: 11,
    coins_balance: 950,
    login_streak: 4,
  },
  {
    $id: 'ath_4',
    full_name: 'Aisha Mensah',
    username: 'aisha_mensah',
    email: 'aisha@sportix.io',
    role: 'athlete',
    sport: 'Tennis',
    sports: ['Tennis'],
    experience_level: 'elite',
    location: 'Delhi, India',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
    bio: 'Ranked tournament singles player.',
    is_open_to_recruit: true,
    is_active: true,
    is_onboarding_complete: true,
    pulse_score: 940,
    level: 20,
    coins_balance: 3100,
    login_streak: 15,
  },
];

export function DiscoverTalentScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>(MOCK_ATHLETES);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All Tiers');

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        const r = await profileService.searchProfiles(query.trim());
        setResults(r.length > 0 ? r : MOCK_ATHLETES.filter(a => 
          a.full_name.toLowerCase().includes(query.toLowerCase()) || 
          a.sport.toLowerCase().includes(query.toLowerCase())
        ));
      } else {
        setResults(MOCK_ATHLETES);
      }
    } catch (e) {
      setResults(MOCK_ATHLETES);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const filteredResults = results.filter((item) => {
    const matchesSport =
      selectedSport === 'All' || item.sport?.toLowerCase() === selectedSport.toLowerCase();
    const matchesTier =
      selectedTier === 'All Tiers' ||
      item.experience_level?.toLowerCase() === selectedTier.toLowerCase().replace('-', '_');
    return matchesSport && matchesTier;
  });

  const renderAthleteCard = ({ item, index }: { item: UserProfile; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(200, index * 50)).duration(350)}>
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          navigation.navigate('AthleteProfile', { userId: item.$id });
        }}
        style={styles.athleteCard}
        activeOpacity={0.88}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri:
                item.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
            }}
            style={styles.avatar}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{item.full_name}</Text>
              <CheckCircle2 size={14} color="#CCFF00" />
            </View>
            <Text style={styles.username}>@{item.username}</Text>
            <View style={styles.metaRow}>
              <MapPin size={10} color="#94A3B8" />
              <Text style={styles.metaLocation}>{item.location || 'India'}</Text>
            </View>
          </View>

          <View style={styles.pulseBadge}>
            <Zap size={12} color="#CCFF00" />
            <Text style={styles.pulseText}>{item.pulse_score || 800} P</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tagsRow}>
            <View style={styles.sportTag}>
              <Text style={styles.sportTagText}>{item.sport?.toUpperCase() || 'SPORTS'}</Text>
            </View>
            <View style={styles.tierTag}>
              <Text style={styles.tierTagText}>
                {item.experience_level?.toUpperCase().replace('_', ' ') || 'AMATEUR'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.challengeBtn}
            onPress={() => {
              triggerHaptic('medium');
              navigation.navigate('DirectChat', {
                conversationId: item.$id,
                title: item.full_name,
              });
            }}
          >
            <Text style={styles.challengeBtnText}>HUDDLE</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
            <Text style={styles.topTitleText}>RADAR DISCOVERY</Text>
            <Text style={styles.topSubText}>ATHLETE NETWORKING</Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{filteredResults.length} FOUND</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by athlete name, sport, or city..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
            />
          </View>

          {/* Sport Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {SPORT_FILTERS.map((sport) => {
              const isSel = selectedSport === sport;
              return (
                <TouchableOpacity
                  key={sport}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedSport(sport);
                  }}
                >
                  <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                    {sport.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tier Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {TIER_FILTERS.map((tier) => {
              const isSel = selectedTier === tier;
              return (
                <TouchableOpacity
                  key={tier}
                  style={[styles.tierChip, isSel && styles.tierChipActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedTier(tier);
                  }}
                >
                  <Text style={[styles.tierChipText, isSel && styles.tierChipTextActive]}>
                    {tier.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* List of Athletes */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>SCANNING ATHLETE RADAR...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredResults}
            keyExtractor={(u) => u.$id}
            renderItem={renderAthleteCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="🔍"
                title="NO ATHLETES FOUND"
                subtitle="Try adjusting your sport discipline or skill filters."
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
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  topSubText: {
    fontSize: 8,
    fontFamily: 'Urbanist_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  countPillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C131A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#FFF',
  },
  filterScroll: {
    gap: 6,
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
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
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
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#121A22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tierChipActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  tierChipText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#94A3B8',
  },
  tierChipTextActive: {
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
    color: '#CCFF00',
    letterSpacing: 0.8,
  },

  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  athleteCard: {
    backgroundColor: '#0C131A',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#CCFF00',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullName: {
    fontSize: 14,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  username: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLocation: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: '#94A3B8',
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  pulseText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sportTag: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportTagText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
  },
  tierTag: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierTagText: {
    fontSize: 8,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#00D4FF',
  },
  challengeBtn: {
    backgroundColor: '#121A22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  challengeBtnText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
