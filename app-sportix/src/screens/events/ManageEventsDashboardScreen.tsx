/**
 * src/screens/events/ManageEventsDashboardScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Manage Events Dashboard for Tournament Organizers & Hosts.
 * Allows organizers to view, filter, live-manage, and update tournament lifecycle states.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Plus,
  Settings,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react-native';

import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { eventService } from '../../services/eventService';
import { SportixEvent } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export function ManageEventsDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);

  const [events, setEvents] = useState<SportixEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents({ limit: 50 });
      setEvents(data);
    } catch (e) {
      console.warn('[ManageEvents] load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    loadEvents();
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'upcoming') return e.status === 'upcoming';
    if (filter === 'ongoing') return e.status === 'ongoing';
    if (filter === 'completed') return e.status === 'completed' || e.status === 'cancelled';
    return true;
  });

  const renderEventItem = ({ item, index }: { item: SportixEvent; index: number }) => {
    const date = item.date ? new Date(item.date) : null;
    const curParts = item.current_participants || 0;
    const maxParts = item.max_participants || 32;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(350)} style={styles.cardWrap}>
        <View style={styles.eventCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{item.sport.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                item.status === 'ongoing'
                  ? styles.statusLive
                  : item.status === 'completed'
                  ? styles.statusCompleted
                  : styles.statusUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  item.status === 'ongoing'
                    ? { color: '#00D4FF' }
                    : item.status === 'completed'
                    ? { color: '#94A3B8' }
                    : { color: '#00FF78' },
                ]}
              >
                {item.status ? item.status.toUpperCase() : 'UPCOMING'}
              </Text>
            </View>
          </View>

          {/* Title & Meta */}
          <Text style={styles.cardTitle}>{item.title}</Text>

          <View style={styles.metaRow}>
            <Calendar size={12} color="#FF6B00" />
            <Text style={styles.metaText}>
              {date && !isNaN(date.getTime())
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Upcoming'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location || 'Local Arena'}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Users size={12} color="#64748B" />
            <Text style={styles.metaText}>
              {curParts}/{maxParts}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => {
                triggerHaptic('medium');
                navigation.navigate('ManageEvent', { eventId: item.$id });
              }}
              activeOpacity={0.85}
            >
              <Settings size={14} color="#CCFF00" />
              <Text style={styles.manageBtnText}>MANAGE LIFECYCLE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => {
                triggerHaptic('light');
                navigation.navigate('EventDetail', { eventId: item.$id });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.viewBtnText}>VIEW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#04070A', '#070D12', '#04070A']} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              navigation.goBack();
            }}
            style={styles.headerIconBtn}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>MANAGE MY EVENTS</Text>
            <Text style={styles.headerSubtitle}>Tournament Command Center</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('medium');
              navigation.navigate('CreateEvent');
            }}
            style={styles.addBtn}
          >
            <Plus size={18} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'ALL CLASHES' },
            { id: 'upcoming', label: 'UPCOMING' },
            { id: 'ongoing', label: 'LIVE' },
            { id: 'completed', label: 'FINISHED' },
          ].map((tab) => {
            const isSel = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterBtn, isSel && styles.filterBtnActive]}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilter(tab.id as any);
                }}
              >
                <Text style={[styles.filterBtnText, isSel && styles.filterBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#CCFF00" size="large" />
            <Text style={styles.loaderText}>LOADING ORGANIZER TOURNAMENTS...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(e) => e.$id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#CCFF00"
                colors={['#CCFF00', '#FF6B00']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Trophy size={40} color="#64748B" />
                <Text style={styles.emptyTitle}>NO TOURNAMENTS FOUND</Text>
                <Text style={styles.emptySub}>
                  You haven't hosted any events matching this filter yet.
                </Text>
                <TouchableOpacity
                  style={styles.hostNowBtn}
                  onPress={() => navigation.navigate('CreateEvent')}
                >
                  <Plus size={16} color="#000" strokeWidth={3} />
                  <Text style={styles.hostNowBtnText}>HOST TOURNAMENT NOW</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0C131A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterBtnText: {
    fontSize: 10,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  cardWrap: {
    marginBottom: 4,
  },
  eventCard: {
    borderRadius: 20,
    backgroundColor: '#0C131A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  sportBadgeText: {
    fontSize: 9,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUpcoming: {
    backgroundColor: 'rgba(0, 255, 120, 0.12)',
  },
  statusLive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: 'Urbanist_800ExtraBold',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#94A3B8',
  },
  metaDot: {
    color: '#475569',
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  manageBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_900Black',
    color: '#CCFF00',
    letterSpacing: 0.5,
  },
  viewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#121C26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#FFF',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 11,
    fontFamily: 'Urbanist_800ExtraBold',
    color: '#CCFF00',
    letterSpacing: 0.8,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_900Black',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  hostNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  hostNowBtnText: {
    fontSize: 12,
    fontFamily: 'Urbanist_900Black',
    color: '#000',
  },
});
